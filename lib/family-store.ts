import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FamilyMember, FamilyRelation } from "@/lib/family-types";
import { familyRelations } from "@/lib/family-types";

type FamilyStore = {
  members: FamilyMember[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmFamilyStore?: FamilyStore;
};

const storeFile = join(process.cwd(), ".data", "family-members.json");

function readStoreFromDisk(): FamilyStore {
  try {
    if (!existsSync(storeFile)) return { members: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<FamilyStore>;
    return { members: Array.isArray(parsed.members) ? parsed.members : [] };
  } catch {
    return { members: [] };
  }
}

function writeStoreToDisk(store: FamilyStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmFamilyStore ??= readStoreFromDisk();
  return globalStore.__mgmFamilyStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneKey(phone: string) {
  return phone.replace(/\D/g, "");
}

export function listFamilyMembers(ownerPhone: string) {
  const normalizedPhone = normalizePhoneKey(ownerPhone);
  if (normalizedPhone.length < 6) return [];

  return getStore().members.filter((member) => normalizePhoneKey(member.ownerPhone) === normalizedPhone);
}

export function addFamilyMember(input: Record<string, unknown>) {
  const ownerPhone = normalizeText(input.ownerPhone);
  const name = normalizeText(input.name);
  if (normalizePhoneKey(ownerPhone).length < 6) return { error: "A valid phone number is required." };
  if (!name) return { error: "Family member name is required." };

  const relation = normalizeText(input.relation);
  const store = getStore();
  const member: FamilyMember = {
    id: `FAM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    ownerPhone,
    name,
    relation: familyRelations.includes(relation as FamilyRelation) ? (relation as FamilyRelation) : "Other",
    age: normalizeText(input.age) || undefined,
    phone: normalizeText(input.phone) || undefined,
    notes: normalizeText(input.notes) || undefined
  };

  store.members.unshift(member);
  writeStoreToDisk(store);
  return { member };
}

export function removeFamilyMember(id: string, ownerPhone: string) {
  const normalizedPhone = normalizePhoneKey(ownerPhone);
  const store = getStore();
  const before = store.members.length;
  store.members = store.members.filter((member) => !(member.id === id && normalizePhoneKey(member.ownerPhone) === normalizedPhone));
  if (store.members.length === before) return false;
  writeStoreToDisk(store);
  return true;
}
