import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getHmsModule, hmsModules } from "@/lib/hms-modules";
import type { HmsModuleRecord, HmsRecordStatus } from "@/lib/hms-types";

type HmsStore = {
  records: HmsModuleRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmHmsStore?: HmsStore;
};

const storeFile = join(process.cwd(), ".data", "hms-modules.json");

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

function readStoreFromDisk(): HmsStore {
  try {
    if (!existsSync(storeFile)) return { records: createSeedRecords() };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<HmsStore>;
    return { records: Array.isArray(parsed.records) ? parsed.records : createSeedRecords() };
  } catch {
    return { records: createSeedRecords() };
  }
}

function writeStoreToDisk(store: HmsStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmHmsStore ??= readStoreFromDisk();
  return globalStore.__mgmHmsStore;
}

export function listHmsRecords(moduleId?: string) {
  const records = getStore().records;
  return moduleId ? records.filter((record) => record.moduleId === moduleId) : records;
}

export function createHmsRecord(input: {
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
    id: `HMS-R-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    moduleId: hmsModule.id,
    title: input.title.trim(),
    status: input.status || "Pending",
    owner: input.owner?.trim() || hmsModule.group,
    priority: input.priority || "Normal",
    notes: input.notes?.trim() || "",
    createdAt: now,
    updatedAt: now
  };

  const store = getStore();
  store.records.unshift(record);
  writeStoreToDisk(store);
  return record;
}

export function updateHmsRecord(input: {
  id: string;
  status?: HmsRecordStatus;
  owner?: string;
  priority?: HmsModuleRecord["priority"];
  notes?: string;
}) {
  const record = getStore().records.find((item) => item.id === input.id);
  if (!record) return null;

  if (input.status) record.status = input.status;
  if (typeof input.owner === "string") record.owner = input.owner.trim();
  if (input.priority) record.priority = input.priority;
  if (typeof input.notes === "string") record.notes = input.notes.trim();
  record.updatedAt = new Date().toISOString();

  writeStoreToDisk(getStore());
  return record;
}
