import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createDocumentStore } from "@/lib/document-store";
import type { AccessRole } from "@/lib/access/matrix";

export const accessSessionCookie = "mgm_session";

/** Absolute session lifetime. */
const sessionTtlMs = 8 * 60 * 60 * 1000;
/** Auto-logout after this much inactivity (shared reception/nursing terminals). */
const idleTimeoutMs = 30 * 60 * 1000;
/** Elevated (Super Admin mode) grants expire after this window. */
const elevationTtlMs = 30 * 60 * 1000;
/** Only persist lastSeenAt when it moved by at least this much, to bound writes. */
const lastSeenWriteIntervalMs = 60 * 1000;

export type AccessSessionStatus = "active" | "mfa-pending" | "mfa-setup-required" | "password-change-required";

export type AccessSession = {
  id: string;
  tokenHash: string;
  userId: string;
  activeRole: AccessRole;
  status: AccessSessionStatus;
  elevatedUntil?: string;
  /** Role to restore when elevation expires or is dropped. */
  preElevationRole?: AccessRole;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  ip: string;
  userAgent: string;
  revokedAt?: string;
};

type AccessSessionStore = {
  sessions: AccessSession[];
};

const maxSessions = 2000;

const store = createDocumentStore<AccessSessionStore>("access-sessions", (parsed) => {
  const doc = parsed as Partial<AccessSessionStore> | undefined;
  return { sessions: Array.isArray(doc?.sessions) ? (doc.sessions as AccessSession[]) : [] };
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createAccessSession(input: {
  userId: string;
  activeRole: AccessRole;
  status: AccessSessionStatus;
  ip: string;
  userAgent: string;
}) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const session: AccessSession = {
    id: `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tokenHash: hashToken(token),
    userId: input.userId,
    activeRole: input.activeRole,
    status: input.status,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionTtlMs).toISOString(),
    lastSeenAt: now.toISOString(),
    ip: input.ip,
    userAgent: input.userAgent
  };

  const doc = await store.load();
  doc.sessions = [session, ...doc.sessions].slice(0, maxSessions);
  await store.save(doc);
  return { token, session };
}

/**
 * Resolves a raw cookie token to a live session, enforcing revocation,
 * absolute expiry, and the idle timeout. Returns null for anything not live.
 */
export async function getSessionByToken(token: string | undefined | null): Promise<AccessSession | null> {
  if (!token) return null;
  const doc = await store.load();
  const tokenHash = hashToken(token);
  const session = doc.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || session.revokedAt) return null;

  const now = Date.now();
  if (new Date(session.expiresAt).getTime() <= now) return null;
  if (now - new Date(session.lastSeenAt).getTime() > idleTimeoutMs) {
    session.revokedAt = new Date(now).toISOString();
    await store.save(doc);
    return null;
  }

  let dirty = false;
  if (session.elevatedUntil && new Date(session.elevatedUntil).getTime() <= now) {
    if (session.preElevationRole) session.activeRole = session.preElevationRole;
    session.elevatedUntil = undefined;
    session.preElevationRole = undefined;
    dirty = true;
  }

  if (now - new Date(session.lastSeenAt).getTime() >= lastSeenWriteIntervalMs) {
    session.lastSeenAt = new Date(now).toISOString();
    dirty = true;
  }

  if (dirty) await store.save(doc);
  return session;
}

export async function updateAccessSession(
  id: string,
  updates: Partial<Pick<AccessSession, "status" | "activeRole" | "elevatedUntil" | "preElevationRole">>
) {
  const doc = await store.load();
  const session = doc.sessions.find((item) => item.id === id);
  if (!session) return null;
  Object.assign(session, updates);
  await store.save(doc);
  return session;
}

export async function grantElevation(id: string, previousRole: AccessRole) {
  return updateAccessSession(id, {
    activeRole: "super-admin",
    preElevationRole: previousRole,
    elevatedUntil: new Date(Date.now() + elevationTtlMs).toISOString()
  });
}

export async function dropElevation(id: string) {
  const doc = await store.load();
  const session = doc.sessions.find((item) => item.id === id);
  if (!session) return null;
  if (session.preElevationRole) session.activeRole = session.preElevationRole;
  session.elevatedUntil = undefined;
  session.preElevationRole = undefined;
  await store.save(doc);
  return session;
}

export function isElevated(session: AccessSession, now = Date.now()) {
  return Boolean(session.elevatedUntil && new Date(session.elevatedUntil).getTime() > now);
}

export async function revokeAccessSession(id: string) {
  const doc = await store.load();
  const session = doc.sessions.find((item) => item.id === id);
  if (!session || session.revokedAt) return null;
  session.revokedAt = new Date().toISOString();
  await store.save(doc);
  return session;
}

export async function revokeAllSessionsForUser(userId: string, exceptSessionId?: string) {
  const doc = await store.load();
  const now = new Date().toISOString();
  let count = 0;
  for (const session of doc.sessions) {
    if (session.userId === userId && !session.revokedAt && session.id !== exceptSessionId) {
      session.revokedAt = now;
      count += 1;
    }
  }
  if (count) await store.save(doc);
  return count;
}

export async function listSessionsForUser(userId: string) {
  const now = Date.now();
  return (await store.load()).sessions.filter(
    (session) => session.userId === userId && !session.revokedAt && new Date(session.expiresAt).getTime() > now
  );
}

export function buildSessionCookie(token: string) {
  return {
    name: accessSessionCookie,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlMs / 1000
  };
}

export function clearSessionCookie() {
  return {
    name: accessSessionCookie,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export function getSessionTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").find((cookie) => cookie.trim().startsWith(`${accessSessionCookie}=`));
  return entry?.trim().slice(accessSessionCookie.length + 1) || null;
}
