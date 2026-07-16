import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

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

const store = createDocumentStore<PatientSessionStore>("patient-sessions", (parsed) => {
  const doc = parsed as Partial<PatientSessionStore> | undefined;
  return { sessions: Array.isArray(doc?.sessions) ? (doc.sessions as PatientSession[]) : [] };
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createPatientSession(input: { identityId: string; phone: string; ip: string; userAgent: string }) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const session: PatientSession = {
    id: generateId("PSE", 4),
    tokenHash: hashToken(token),
    identityId: input.identityId,
    phone: input.phone,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionTtlMs).toISOString(),
    ip: input.ip,
    userAgent: input.userAgent
  };
  const doc = await store.load();
  doc.sessions = [session, ...doc.sessions].slice(0, 5000);
  await store.save(doc);
  return { token, session };
}

export async function getPatientSessionByToken(token: string | null | undefined): Promise<PatientSession | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = (await store.load()).sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || session.revokedAt) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export async function revokePatientSession(id: string) {
  const doc = await store.load();
  const session = doc.sessions.find((item) => item.id === id);
  if (!session || session.revokedAt) return null;
  session.revokedAt = new Date().toISOString();
  await store.save(doc);
  return session;
}

export async function revokePatientSessionsForIdentity(identityId: string) {
  const doc = await store.load();
  const now = new Date().toISOString();
  let count = 0;
  for (const session of doc.sessions) {
    if (session.identityId === identityId && !session.revokedAt) {
      session.revokedAt = now;
      count += 1;
    }
  }
  if (count) await store.save(doc);
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

export async function getPatientSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").find((cookie) => cookie.trim().startsWith(`${patientSessionCookie}=`));
  const token = entry?.trim().slice(patientSessionCookie.length + 1) || null;
  return getPatientSessionByToken(token);
}
