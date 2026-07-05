import type { AccessRole } from "@/lib/access/matrix";

export type AuditActorRole = "admin" | "doctor" | "patient" | "mobile" | "system" | AccessRole;

export type AuditSeverity = "info" | "warning" | "critical";

/** A single field's value before and after a mutation. */
export type AuditFieldChange = { before: unknown; after: unknown };

/** Field-level diff of a record mutation, keyed by field name. */
export type AuditChangeSet = Record<string, AuditFieldChange>;

/** Where an audited action came from — for accountability, not analytics. */
export type AuditDeviceContext = {
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
};

export type AuditEvent = {
  id: string;
  createdAt: string;
  actorRole: AuditActorRole;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  severity: AuditSeverity;
  metadata: Record<string, unknown>;
  /** Populated for record edits: what changed, old value → new value. */
  changes?: AuditChangeSet;
  /** Populated for request-scoped actions: originating device/network. */
  device?: AuditDeviceContext;
};

