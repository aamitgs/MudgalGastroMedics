import "server-only";

import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
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

const store = createDocumentStore<ApprovalsStore>("access-approvals", (parsed) => {
  const doc = parsed as Partial<ApprovalsStore> | undefined;
  return { approvals: Array.isArray(doc?.approvals) ? (doc.approvals as AccessApproval[]) : [] };
});

export async function createRoleChangeApproval(input: {
  targetUserId: string;
  targetUserName: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  requestedBy: string;
  requestedByName: string;
}) {
  const approval: AccessApproval = {
    id: generateId("APR", 4),
    type: "role-change",
    targetUserId: input.targetUserId,
    targetUserName: input.targetUserName,
    payload: { roles: input.roles, defaultRole: input.defaultRole },
    requestedBy: input.requestedBy,
    requestedByName: input.requestedByName,
    requestedAt: new Date().toISOString(),
    status: "pending"
  };
  const doc = await store.load();
  doc.approvals = [approval, ...doc.approvals].slice(0, 500);
  await store.save(doc);
  return approval;
}

export async function getApprovalById(id: string) {
  return (await store.load()).approvals.find((approval) => approval.id === id) ?? null;
}

export async function listApprovals(status?: AccessApproval["status"]) {
  const approvals = (await store.load()).approvals;
  return status ? approvals.filter((approval) => approval.status === status) : approvals;
}

export async function decideApproval(id: string, decision: "approved" | "rejected", decidedBy: string, decidedByName: string) {
  const doc = await store.load();
  const approval = doc.approvals.find((item) => item.id === id);
  if (!approval || approval.status !== "pending") return null;
  approval.status = decision;
  approval.decidedBy = decidedBy;
  approval.decidedByName = decidedByName;
  approval.decidedAt = new Date().toISOString();
  await store.save(doc);
  return approval;
}
