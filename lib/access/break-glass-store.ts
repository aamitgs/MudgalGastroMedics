import "server-only";

import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

/**
 * Break-glass emergency access: a doctor asserts a genuine emergency and gains
 * time-boxed read access to clinical records outside their normal scope. Every
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

const store = createDocumentStore<BreakGlassStore>("access-break-glass", (parsed) => {
  const doc = parsed as Partial<BreakGlassStore> | undefined;
  return { grants: Array.isArray(doc?.grants) ? (doc.grants as BreakGlassGrant[]) : [] };
});

export async function createBreakGlassGrant(input: { userId: string; userName: string; reason: string }) {
  const now = new Date();
  const grant: BreakGlassGrant = {
    id: generateId("BGL", 4),
    userId: input.userId,
    userName: input.userName,
    reason: input.reason,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + grantTtlMs).toISOString(),
    usedCount: 0
  };
  const doc = await store.load();
  doc.grants = [grant, ...doc.grants].slice(0, 200);
  await store.save(doc);
  return grant;
}

export async function getActiveBreakGlassGrant(userId: string, now = Date.now()) {
  return (
    (await store.load()).grants.find(
      (grant) => grant.userId === userId && new Date(grant.expiresAt).getTime() > now
    ) ?? null
  );
}

export async function recordBreakGlassUse(grantId: string) {
  const doc = await store.load();
  const grant = doc.grants.find((item) => item.id === grantId);
  if (!grant) return null;
  grant.usedCount += 1;
  await store.save(doc);
  return grant;
}

export async function listBreakGlassGrants() {
  return (await store.load()).grants;
}
