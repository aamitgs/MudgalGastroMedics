import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

const globalStore = globalThis as typeof globalThis & {
  __mgmAccessSessionStore?: AccessSessionStore;
};

const storeFile = join(process.cwd(), ".data", "access-sessions.json");
const maxSessions = 2000;

function readStoreFromDisk(): AccessSessionStore {
  if (!existsSync(storeFile)) return { sessions: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<AccessSessionStore>;
    return { sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
  } catch {
    return { sessions: [] };
  }
}

function writeStoreToDisk(store: AccessSessionStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmAccessSessionStore ??= readStoreFromDisk();
  return globalStore.__mgmAccessSessionStore;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function createAccessSession(input: {
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

  const store = getStore();
  store.sessions = [session, ...store.sessions].slice(0, maxSessions);
  writeStoreToDisk(store);
  return { token, session };
}

/**
 * Resolves a raw cookie token to a live session, enforcing revocation,
 * absolute expiry, and the idle timeout. Returns null for anything not live.
 */
export function getSessionByToken(token: string | undefined | null): AccessSession | null {
  if (!token) return null;
  const store = getStore();
  const tokenHash = hashToken(token);
  const session = store.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || session.revokedAt) return null;

  const now = Date.now();
  if (new Date(session.expiresAt).getTime() <= now) return null;
  if (now - new Date(session.lastSeenAt).getTime() > idleTimeoutMs) {
    session.revokedAt = new Date(now).toISOString();
    writeStoreToDisk(store);
    return null;
  }

  if (session.elevatedUntil && new Date(session.elevatedUntil).getTime() <= now) {
    if (session.preElevationRole) session.activeRole = session.preElevationRole;
    session.elevatedUntil = undefined;
    session.preElevationRole = undefined;
    writeStoreToDisk(store);
  }

  if (now - new Date(session.lastSeenAt).getTime() >= lastSeenWriteIntervalMs) {
    session.lastSeenAt = new Date(now).toISOString();
    writeStoreToDisk(store);
  }

  return session;
}

export function updateAccessSession(id: string, updates: Partial<Pick<AccessSession, "status" | "activeRole" | "elevatedUntil" | "preElevationRole">>) {
  const store = getStore();
  const session = store.sessions.find((item) => item.id === id);
  if (!session) return null;
  Object.assign(session, updates);
  writeStoreToDisk(store);
  return session;
}

export function grantElevation(id: string, previousRole: AccessRole) {
  return updateAccessSession(id, {
    activeRole: "super-admin",
    preElevationRole: previousRole,
    elevatedUntil: new Date(Date.now() + elevationTtlMs).toISOString()
  });
}

export function dropElevation(id: string) {
  const store = getStore();
  const session = store.sessions.find((item) => item.id === id);
  if (!session) return null;
  if (session.preElevationRole) session.activeRole = session.preElevationRole;
  session.elevatedUntil = undefined;
  session.preElevationRole = undefined;
  writeStoreToDisk(store);
  return session;
}

export function isElevated(session: AccessSession, now = Date.now()) {
  return Boolean(session.elevatedUntil && new Date(session.elevatedUntil).getTime() > now);
}

export function revokeAccessSession(id: string) {
  const store = getStore();
  const session = store.sessions.find((item) => item.id === id);
  if (!session || session.revokedAt) return null;
  session.revokedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return session;
}

export function revokeAllSessionsForUser(userId: string, exceptSessionId?: string) {
  const store = getStore();
  const now = new Date().toISOString();
  let count = 0;
  for (const session of store.sessions) {
    if (session.userId === userId && !session.revokedAt && session.id !== exceptSessionId) {
      session.revokedAt = now;
      count += 1;
    }
  }
  if (count) writeStoreToDisk(store);
  return count;
}

export function listSessionsForUser(userId: string) {
  const now = Date.now();
  return getStore().sessions.filter(
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
