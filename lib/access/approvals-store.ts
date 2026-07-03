import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AccessRole } from "@/lib/access/matrix";

/**
 * Two-person rule for privileged changes: a role change (including any
 * Super Admin grant) is requested by one Super Admin and only applied after a
 * second, different Super Admin approves it. Removing access (suspension /
 * offboarding) deliberately does NOT go through this queue — revocation must
 * be immediate.
 */
export type AccessApproval = {
  id: string;
  type: "role-change";
  targetUserId: string;
  targetUserName: string;
  payload: { roles: AccessRole[]; defaultRole: AccessRole };
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
};

type ApprovalsStore = {
  approvals: AccessApproval[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmApprovalsStore?: ApprovalsStore;
};

const storeFile = join(process.cwd(), ".data", "access-approvals.json");

function readStoreFromDisk(): ApprovalsStore {
  if (!existsSync(storeFile)) return { approvals: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<ApprovalsStore>;
    return { approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [] };
  } catch {
    return { approvals: [] };
  }
}

function writeStoreToDisk(store: ApprovalsStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmApprovalsStore ??= readStoreFromDisk();
  return globalStore.__mgmApprovalsStore;
}

export function createRoleChangeApproval(input: {
  targetUserId: string;
  targetUserName: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  requestedBy: string;
  requestedByName: string;
}) {
  const approval: AccessApproval = {
    id: `APR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    type: "role-change",
    targetUserId: input.targetUserId,
    targetUserName: input.targetUserName,
    payload: { roles: input.roles, defaultRole: input.defaultRole },
    requestedBy: input.requestedBy,
    requestedByName: input.requestedByName,
    requestedAt: new Date().toISOString(),
    status: "pending"
  };
  const store = getStore();
  store.approvals = [approval, ...store.approvals].slice(0, 500);
  writeStoreToDisk(store);
  return approval;
}

export function getApprovalById(id: string) {
  return getStore().approvals.find((approval) => approval.id === id) ?? null;
}

export function listApprovals(status?: AccessApproval["status"]) {
  const approvals = getStore().approvals;
  return status ? approvals.filter((approval) => approval.status === status) : approvals;
}

export function decideApproval(id: string, decision: "approved" | "rejected", decidedBy: string, decidedByName: string) {
  const store = getStore();
  const approval = store.approvals.find((item) => item.id === id);
  if (!approval || approval.status !== "pending") return null;
  approval.status = decision;
  approval.decidedBy = decidedBy;
  approval.decidedByName = decidedByName;
  approval.decidedAt = new Date().toISOString();
  writeStoreToDisk(store);
  return approval;
}
