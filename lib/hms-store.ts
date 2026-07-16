import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { getHmsModule, hmsModules } from "@/lib/hms-modules";
import type { HmsModuleRecord, HmsRecordStatus } from "@/lib/hms-types";

type HmsStore = {
  records: HmsModuleRecord[];
};



function createSeedRecords(): HmsModuleRecord[] {
  const now = new Date().toISOString();
  return hmsModules.map((module) => ({
    id: `HMS-${String(module.order).padStart(2, "0")}`,
    moduleId: module.id,
    title: `${module.name} implementation`,
    status: module.status === "Live MVP" ? "Active" : "Pending",
    owner: module.group,
    priority: module.status === "Production Pending" ? "Urgent" : module.status === "Planned" ? "Normal" : "High",
    notes: module.nextStep,
    createdAt: now,
    updatedAt: now
  }));
}




const docStore = createDocumentStore<HmsStore>("hms-modules", (parsed) => {
  const doc = parsed as Partial<HmsStore> | undefined;
  return { records: Array.isArray(doc?.records) ? (doc.records as HmsModuleRecord[]) : createSeedRecords() };
});

export async function listHmsRecords(moduleId?: string) {
  const records = (await docStore.load()).records;
  return moduleId ? records.filter((record) => record.moduleId === moduleId) : records;
}

export async function createHmsRecord(input: {
  moduleId: string;
  title: string;
  status?: HmsRecordStatus;
  owner?: string;
  priority?: HmsModuleRecord["priority"];
  notes?: string;
}) {
  const hmsModule = getHmsModule(input.moduleId);
  if (!hmsModule) return null;

  const now = new Date().toISOString();
  const record: HmsModuleRecord = {
    id: generateId("HMS-R"),
    moduleId: hmsModule.id,
    title: input.title.trim(),
    status: input.status || "Pending",
    owner: input.owner?.trim() || hmsModule.group,
    priority: input.priority || "Normal",
    notes: input.notes?.trim() || "",
    createdAt: now,
    updatedAt: now
  };

  const doc = await docStore.load();
  doc.records.unshift(record);
  await docStore.save(doc);
  return record;
}

export async function updateHmsRecord(input: {
  id: string;
  status?: HmsRecordStatus;
  owner?: string;
  priority?: HmsModuleRecord["priority"];
  notes?: string;
}) {
  const doc = await docStore.load();
  const record = doc.records.find((item) => item.id === input.id);
  if (!record) return null;

  if (input.status) record.status = input.status;
  if (typeof input.owner === "string") record.owner = input.owner.trim();
  if (input.priority) record.priority = input.priority;
  if (typeof input.notes === "string") record.notes = input.notes.trim();
  record.updatedAt = new Date().toISOString();

  await docStore.save(doc);
  return record;
}
