import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Break-glass emergency access: a doctor asserts a genuine emergency and gains
 * time-boxed read access to patient records outside their normal scope. Every
 * grant is a critical audit event and every use of the grant increments
 * usedCount so the post-hoc review can see exactly how much it was exercised.
 */
export type BreakGlassGrant = {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
};

type BreakGlassStore = {
  grants: BreakGlassGrant[];
};

const grantTtlMs = 30 * 60 * 1000;

const globalStore = globalThis as typeof globalThis & {
  __mgmBreakGlassStore?: BreakGlassStore;
};

const storeFile = join(process.cwd(), ".data", "access-break-glass.json");

function readStoreFromDisk(): BreakGlassStore {
  if (!existsSync(storeFile)) return { grants: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<BreakGlassStore>;
    return { grants: Array.isArray(parsed.grants) ? parsed.grants : [] };
  } catch {
    return { grants: [] };
  }
}

function writeStoreToDisk(store: BreakGlassStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmBreakGlassStore ??= readStoreFromDisk();
  return globalStore.__mgmBreakGlassStore;
}

export function createBreakGlassGrant(input: { userId: string; userName: string; reason: string }) {
  const now = new Date();
  const grant: BreakGlassGrant = {
    id: `BGL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    userId: input.userId,
    userName: input.userName,
    reason: input.reason,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + grantTtlMs).toISOString(),
    usedCount: 0
  };
  const store = getStore();
  store.grants = [grant, ...store.grants].slice(0, 200);
  writeStoreToDisk(store);
  return grant;
}

export function getActiveBreakGlassGrant(userId: string, now = Date.now()) {
  return (
    getStore().grants.find(
      (grant) => grant.userId === userId && new Date(grant.expiresAt).getTime() > now
    ) ?? null
  );
}

export function recordBreakGlassUse(grantId: string) {
  const store = getStore();
  const grant = store.grants.find((item) => item.id === grantId);
  if (!grant) return null;
  grant.usedCount += 1;
  writeStoreToDisk(store);
  return grant;
}

export function listBreakGlassGrants() {
  return getStore().grants;
}
