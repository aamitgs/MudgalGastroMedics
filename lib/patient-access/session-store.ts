import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const patientSessionCookie = "mgm_patient_session";

/**
 * Patient sessions favour convenience over ceremony: 30-day lifetime, no idle
 * timeout (personal phones, not shared hospital terminals). Still server-side
 * and revocable, with only the token hash persisted.
 */
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000;

export type PatientSession = {
  id: string;
  tokenHash: string;
  identityId: string;
  phone: string;
  createdAt: string;
  expiresAt: string;
  ip: string;
  userAgent: string;
  revokedAt?: string;
};

type PatientSessionStore = {
  sessions: PatientSession[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmPatientSessionStore?: PatientSessionStore;
};

const storeFile = join(process.cwd(), ".data", "patient-sessions.json");

function readStoreFromDisk(): PatientSessionStore {
  if (!existsSync(storeFile)) return { sessions: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<PatientSessionStore>;
    return { sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
  } catch {
    return { sessions: [] };
  }
}

function writeStoreToDisk(store: PatientSessionStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmPatientSessionStore ??= readStoreFromDisk();
  return globalStore.__mgmPatientSessionStore;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function createPatientSession(input: { identityId: string; phone: string; ip: string; userAgent: string }) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const session: PatientSession = {
    id: `PSE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tokenHash: hashToken(token),
    identityId: input.identityId,
    phone: input.phone,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionTtlMs).toISOString(),
    ip: input.ip,
    userAgent: input.userAgent
  };
  const store = getStore();
  store.sessions = [session, ...store.sessions].slice(0, 5000);
  writeStoreToDisk(store);
  return { token, session };
}

export function getPatientSessionByToken(token: string | null | undefined): PatientSession | null {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = getStore().sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || session.revokedAt) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export function revokePatientSession(id: string) {
  const store = getStore();
  const session = store.sessions.find((item) => item.id === id);
  if (!session || session.revokedAt) return null;
  session.revokedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return session;
}

export function revokePatientSessionsForIdentity(identityId: string) {
  const store = getStore();
  const now = new Date().toISOString();
  let count = 0;
  for (const session of store.sessions) {
    if (session.identityId === identityId && !session.revokedAt) {
      session.revokedAt = now;
      count += 1;
    }
  }
  if (count) writeStoreToDisk(store);
  return count;
}

export function buildPatientSessionCookie(token: string) {
  return {
    name: patientSessionCookie,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlMs / 1000
  };
}

export function clearPatientSessionCookie() {
  return {
    name: patientSessionCookie,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function getPatientSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").find((cookie) => cookie.trim().startsWith(`${patientSessionCookie}=`));
  const token = entry?.trim().slice(patientSessionCookie.length + 1) || null;
  return getPatientSessionByToken(token);
}
