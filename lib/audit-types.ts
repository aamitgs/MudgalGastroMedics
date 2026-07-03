import type { AccessRole } from "@/lib/access/matrix";

export type AuditActorRole = "admin" | "doctor" | "patient" | "mobile" | "system" | AccessRole;

export type AuditSeverity = "info" | "warning" | "critical";

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
};

