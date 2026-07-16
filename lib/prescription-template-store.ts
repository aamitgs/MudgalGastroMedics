import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AccessRole } from "@/lib/access/matrix";
import type { PrescriptionTemplate } from "@/lib/prescription-template-types";

type PrescriptionTemplateStore = { templates: PrescriptionTemplate[] };

const store = createDocumentStore<PrescriptionTemplateStore>("prescription-templates", (parsed) => {
  const doc = parsed as Partial<PrescriptionTemplateStore> | undefined;
  return { templates: Array.isArray(doc?.templates) ? (doc.templates as PrescriptionTemplate[]) : [] };
});

export async function listPrescriptionTemplates() {
  return (await store.load()).templates;
}

export async function createPrescriptionTemplate(input: {
  name: string;
  tag?: string;
  prescriptionText: string;
  createdBy: string;
  createdByRole: AccessRole;
}) {
  const doc = await store.load();
  const now = new Date().toISOString();
  const template: PrescriptionTemplate = {
    id: generateId("RXT"),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    tag: input.tag,
    prescriptionText: input.prescriptionText,
    createdBy: input.createdBy,
    createdByRole: input.createdByRole
  };
  doc.templates.unshift(template);
  await store.save(doc);
  return template;
}

export async function updatePrescriptionTemplate(id: string, updates: { name?: string; tag?: string; prescriptionText?: string }) {
  const doc = await store.load();
  const template = doc.templates.find((item) => item.id === id);
  if (!template) return null;
  if (updates.name !== undefined) template.name = updates.name;
  if (updates.tag !== undefined) template.tag = updates.tag;
  if (updates.prescriptionText !== undefined) template.prescriptionText = updates.prescriptionText;
  template.updatedAt = new Date().toISOString();
  await store.save(doc);
  return template;
}

export async function deletePrescriptionTemplate(id: string) {
  const doc = await store.load();
  const index = doc.templates.findIndex((item) => item.id === id);
  if (index === -1) return false;
  doc.templates.splice(index, 1);
  await store.save(doc);
  return true;
}
