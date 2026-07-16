import "server-only";

import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AccessRole } from "@/lib/access/matrix";
import { isAccessRole } from "@/lib/access/matrix";

export type AccessUserStatus = "active" | "suspended";

export type AccessUser = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: AccessUserStatus;
  name: string;
  username: string;
  email?: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  passwordHash: string;
  mustChangePassword: boolean;
  totpSecret?: string;
  totpEnabled: boolean;
  failedLoginCount: number;
  lockedUntil?: string;
  lastLoginAt?: string;
};

type AccessUserStore = {
  users: AccessUser[];
};

const store = createDocumentStore<AccessUserStore>("access-users", (parsed) => {
  const doc = parsed as Partial<AccessUserStore> | undefined;
  return { users: Array.isArray(doc?.users) ? (doc.users as AccessUser[]) : [] };
});

function makeUserId() {
  return generateId("USR", 4);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function listAccessUsers(): Promise<AccessUser[]> {
  return (await store.load()).users;
}

export async function getAccessUserById(id: string) {
  return (await store.load()).users.find((user) => user.id === id) ?? null;
}

export async function getAccessUserByUsername(username: string) {
  const normalized = normalizeUsername(username);
  return (await store.load()).users.find((user) => user.username === normalized) ?? null;
}

export async function createAccessUser(input: {
  name: string;
  username: string;
  email?: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  passwordHash: string;
  mustChangePassword?: boolean;
}): Promise<AccessUser | { error: string }> {
  const username = normalizeUsername(input.username);
  if (!username || !/^[a-z0-9][a-z0-9._-]{1,40}$/.test(username)) {
    return { error: "Username must be 2-41 characters of letters, numbers, dots, hyphens or underscores." };
  }
  if (await getAccessUserByUsername(username)) {
    return { error: `Username "${username}" is already taken.` };
  }
  const roles = input.roles.filter((role) => isAccessRole(role));
  if (!roles.length) return { error: "At least one valid role is required." };
  const defaultRole = roles.includes(input.defaultRole) ? input.defaultRole : roles[0];

  const now = new Date().toISOString();
  const user: AccessUser = {
    id: makeUserId(),
    createdAt: now,
    updatedAt: now,
    status: "active",
    name: input.name.trim(),
    username,
    email: input.email?.trim() || undefined,
    roles,
    defaultRole,
    passwordHash: input.passwordHash,
    mustChangePassword: input.mustChangePassword ?? true,
    totpEnabled: false,
    failedLoginCount: 0
  };

  const doc = await store.load();
  doc.users = [user, ...doc.users];
  await store.save(doc);
  return user;
}

export async function updateAccessUser(id: string, updates: Partial<Omit<AccessUser, "id" | "createdAt" | "username">>) {
  const doc = await store.load();
  const user = doc.users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  await store.save(doc);
  return user;
}

/**
 * Exponential-backoff lockout: free retries for the first 3 failures, then the
 * account locks for 2^(failures-3) minutes, capped at 60 minutes.
 */
export function lockoutMinutesForFailures(failures: number) {
  if (failures <= 3) return 0;
  return Math.min(2 ** (failures - 3), 60);
}

export function isUserLockedOut(user: AccessUser, now = Date.now()) {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > now);
}

export async function recordLoginFailure(id: string) {
  const user = await getAccessUserById(id);
  if (!user) return null;
  const failedLoginCount = user.failedLoginCount + 1;
  const minutes = lockoutMinutesForFailures(failedLoginCount);
  return updateAccessUser(id, {
    failedLoginCount,
    lockedUntil: minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : user.lockedUntil
  });
}

export async function recordLoginSuccess(id: string) {
  return updateAccessUser(id, {
    failedLoginCount: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date().toISOString()
  });
}
