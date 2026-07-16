import "server-only";

import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

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

const store = createDocumentStore<PatientIdentityStore>("patient-identities", (parsed) => {
  const doc = parsed as Partial<PatientIdentityStore> | undefined;
  return { identities: Array.isArray(doc?.identities) ? (doc.identities as PatientIdentity[]) : [] };
});

export function normalizePatientPhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

export async function getPatientIdentityByPhone(phone: string) {
  const normalized = normalizePatientPhone(phone);
  return (await store.load()).identities.find((identity) => identity.phone === normalized) ?? null;
}

export async function getPatientIdentityByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return (await store.load()).identities.find((identity) => identity.email === normalized) ?? null;
}

export async function getPatientIdentityById(id: string) {
  return (await store.load()).identities.find((identity) => identity.id === id) ?? null;
}

/** Creates the identity on first successful OTP verification (lazy signup). */
export async function ensurePatientIdentity(phone: string): Promise<PatientIdentity> {
  const existing = await getPatientIdentityByPhone(phone);
  if (existing) return existing;
  const now = new Date().toISOString();
  const identity: PatientIdentity = {
    id: generateId("PID", 4),
    createdAt: now,
    updatedAt: now,
    phone: normalizePatientPhone(phone),
    failedLoginCount: 0
  };
  const doc = await store.load();
  doc.identities = [identity, ...doc.identities];
  await store.save(doc);
  return identity;
}

export async function updatePatientIdentity(id: string, updates: Partial<Omit<PatientIdentity, "id" | "createdAt" | "phone">>) {
  const doc = await store.load();
  const identity = doc.identities.find((item) => item.id === id);
  if (!identity) return null;
  Object.assign(identity, updates, { updatedAt: new Date().toISOString() });
  await store.save(doc);
  return identity;
}

export function isPatientLockedOut(identity: PatientIdentity, now = Date.now()) {
  return Boolean(identity.lockedUntil && new Date(identity.lockedUntil).getTime() > now);
}

export async function recordPatientLoginFailure(id: string) {
  const identity = await getPatientIdentityById(id);
  if (!identity) return null;
  const failedLoginCount = identity.failedLoginCount + 1;
  const minutes = failedLoginCount <= 4 ? 0 : Math.min(2 ** (failedLoginCount - 4), 30);
  return updatePatientIdentity(id, {
    failedLoginCount,
    lockedUntil: minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : identity.lockedUntil
  });
}

export async function recordPatientLoginSuccess(id: string) {
  return updatePatientIdentity(id, { failedLoginCount: 0, lockedUntil: undefined, lastLoginAt: new Date().toISOString() });
}
