import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

const globalStore = globalThis as typeof globalThis & {
  __mgmAccessUserStore?: AccessUserStore;
};

const storeFile = join(process.cwd(), ".data", "access-users.json");

function readStoreFromDisk(): AccessUserStore {
  if (!existsSync(storeFile)) return { users: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<AccessUserStore>;
    return { users: Array.isArray(parsed.users) ? parsed.users : [] };
  } catch {
    return { users: [] };
  }
}

function writeStoreToDisk(store: AccessUserStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmAccessUserStore ??= readStoreFromDisk();
  return globalStore.__mgmAccessUserStore;
}

function makeUserId() {
  return `USR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function listAccessUsers(): AccessUser[] {
  return getStore().users;
}

export function getAccessUserById(id: string) {
  return getStore().users.find((user) => user.id === id) ?? null;
}

export function getAccessUserByUsername(username: string) {
  const normalized = normalizeUsername(username);
  return getStore().users.find((user) => user.username === normalized) ?? null;
}

export function createAccessUser(input: {
  name: string;
  username: string;
  email?: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  passwordHash: string;
  mustChangePassword?: boolean;
}): AccessUser | { error: string } {
  const username = normalizeUsername(input.username);
  if (!username || !/^[a-z0-9][a-z0-9._-]{1,40}$/.test(username)) {
    return { error: "Username must be 2-41 characters of letters, numbers, dots, hyphens or underscores." };
  }
  if (getAccessUserByUsername(username)) {
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

  const store = getStore();
  store.users = [user, ...store.users];
  writeStoreToDisk(store);
  return user;
}

export function updateAccessUser(id: string, updates: Partial<Omit<AccessUser, "id" | "createdAt" | "username">>) {
  const store = getStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  writeStoreToDisk(store);
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

export function recordLoginFailure(id: string) {
  const user = getAccessUserById(id);
  if (!user) return null;
  const failedLoginCount = user.failedLoginCount + 1;
  const minutes = lockoutMinutesForFailures(failedLoginCount);
  return updateAccessUser(id, {
    failedLoginCount,
    lockedUntil: minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : user.lockedUntil
  });
}

export function recordLoginSuccess(id: string) {
  return updateAccessUser(id, {
    failedLoginCount: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date().toISOString()
  });
}
