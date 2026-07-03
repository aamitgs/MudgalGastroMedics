import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Patient portal identities — a separate user base from staff (lib/access).
 * Identities are keyed by mobile number (the primary Indian-patient login);
 * email + password and magic links become available once the patient adds an
 * email from inside the portal.
 */
export type PatientIdentity = {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Normalized to the last 10 digits. */
  phone: string;
  email?: string;
  passwordHash?: string;
  failedLoginCount: number;
  lockedUntil?: string;
  lastLoginAt?: string;
};

type PatientIdentityStore = {
  identities: PatientIdentity[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmPatientIdentityStore?: PatientIdentityStore;
};

const storeFile = join(process.cwd(), ".data", "patient-identities.json");

export function normalizePatientPhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function readStoreFromDisk(): PatientIdentityStore {
  if (!existsSync(storeFile)) return { identities: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<PatientIdentityStore>;
    return { identities: Array.isArray(parsed.identities) ? parsed.identities : [] };
  } catch {
    return { identities: [] };
  }
}

function writeStoreToDisk(store: PatientIdentityStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmPatientIdentityStore ??= readStoreFromDisk();
  return globalStore.__mgmPatientIdentityStore;
}

export function getPatientIdentityByPhone(phone: string) {
  const normalized = normalizePatientPhone(phone);
  return getStore().identities.find((identity) => identity.phone === normalized) ?? null;
}

export function getPatientIdentityByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return getStore().identities.find((identity) => identity.email === normalized) ?? null;
}

export function getPatientIdentityById(id: string) {
  return getStore().identities.find((identity) => identity.id === id) ?? null;
}

/** Creates the identity on first successful OTP verification (lazy signup). */
export function ensurePatientIdentity(phone: string): PatientIdentity {
  const existing = getPatientIdentityByPhone(phone);
  if (existing) return existing;
  const now = new Date().toISOString();
  const identity: PatientIdentity = {
    id: `PID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    phone: normalizePatientPhone(phone),
    failedLoginCount: 0
  };
  const store = getStore();
  store.identities = [identity, ...store.identities];
  writeStoreToDisk(store);
  return identity;
}

export function updatePatientIdentity(id: string, updates: Partial<Omit<PatientIdentity, "id" | "createdAt" | "phone">>) {
  const store = getStore();
  const identity = store.identities.find((item) => item.id === id);
  if (!identity) return null;
  Object.assign(identity, updates, { updatedAt: new Date().toISOString() });
  writeStoreToDisk(store);
  return identity;
}

export function isPatientLockedOut(identity: PatientIdentity, now = Date.now()) {
  return Boolean(identity.lockedUntil && new Date(identity.lockedUntil).getTime() > now);
}

export function recordPatientLoginFailure(id: string) {
  const identity = getPatientIdentityById(id);
  if (!identity) return null;
  const failedLoginCount = identity.failedLoginCount + 1;
  const minutes = failedLoginCount <= 4 ? 0 : Math.min(2 ** (failedLoginCount - 4), 30);
  return updatePatientIdentity(id, {
    failedLoginCount,
    lockedUntil: minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : identity.lockedUntil
  });
}

export function recordPatientLoginSuccess(id: string) {
  return updatePatientIdentity(id, { failedLoginCount: 0, lockedUntil: undefined, lastLoginAt: new Date().toISOString() });
}
