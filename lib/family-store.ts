import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { FamilyMember, FamilyRelation } from "@/lib/family-types";
import { familyRelations } from "@/lib/family-types";

type FamilyStore = {
  members: FamilyMember[];
};

const store = createDocumentStore<FamilyStore>("family-members", (parsed) => {
  const doc = parsed as Partial<FamilyStore> | undefined;
  return { members: Array.isArray(doc?.members) ? (doc.members as FamilyMember[]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneKey(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function listFamilyMembers(ownerPhone: string) {
  const normalizedPhone = normalizePhoneKey(ownerPhone);
  if (normalizedPhone.length < 6) return [];

  return (await store.load()).members.filter((member) => normalizePhoneKey(member.ownerPhone) === normalizedPhone);
}

export async function addFamilyMember(input: Record<string, unknown>) {
  const ownerPhone = normalizeText(input.ownerPhone);
  const name = normalizeText(input.name);
  if (normalizePhoneKey(ownerPhone).length < 6) return { error: "A valid phone number is required." };
  if (!name) return { error: "Family member name is required." };

  const relation = normalizeText(input.relation);
  const doc = await store.load();
  const member: FamilyMember = {
    id: generateId("FAM"),
    createdAt: new Date().toISOString(),
    ownerPhone,
    name,
    relation: familyRelations.includes(relation as FamilyRelation) ? (relation as FamilyRelation) : "Other",
    age: normalizeText(input.age) || undefined,
    phone: normalizeText(input.phone) || undefined,
    notes: normalizeText(input.notes) || undefined
  };

  doc.members.unshift(member);
  await store.save(doc);
  return { member };
}

export async function removeFamilyMember(id: string, ownerPhone: string) {
  const normalizedPhone = normalizePhoneKey(ownerPhone);
  const doc = await store.load();
  const before = doc.members.length;
  doc.members = doc.members.filter((member) => !(member.id === id && normalizePhoneKey(member.ownerPhone) === normalizedPhone));
  if (doc.members.length === before) return false;
  await store.save(doc);
  return true;
}
