import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  AuditActorRole,
  AuditChangeSet,
  AuditDeviceContext,
  AuditEvent,
  AuditSeverity
} from "@/lib/audit-types";
import { computeAuditChanges } from "@/lib/audit-diff";
import { query, shouldUseDatabaseStores } from "@/lib/database";

type AuditStore = {
  events: AuditEvent[];
};

type AuditInput = {
  actorRole: AuditActorRole;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
  /** Pre-mutation snapshot; diffed against `after` into a change-set. */
  before?: Record<string, unknown> | null;
  /** Post-mutation snapshot; diffed against `before` into a change-set. */
  after?: Record<string, unknown> | null;
  /** Explicit change-set (overrides before/after diffing when provided). */
  changes?: AuditChangeSet;
  /** Originating device/network context (see auditRequestMetadata). */
  device?: AuditDeviceContext;
};

const globalStore = globalThis as typeof globalThis & {
  __mgmAuditStore?: AuditStore;
};

const storeFile = join(process.cwd(), ".data", "audit-events.json");
const maxEvents = 1000;

type AuditEventRow = {
  legacy_id: string | null;
  id: string;
  created_at: string;
  actor_role: AuditActorRole;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
};

function createEmptyStore(): AuditStore {
  return { events: [] };
}

function readStoreFromDisk(): AuditStore {
  if (!existsSync(storeFile)) return createEmptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<AuditStore>;
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return createEmptyStore();
  }
}

function writeStoreToDisk(store: AuditStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmAuditStore ??= readStoreFromDisk();
  return globalStore.__mgmAuditStore;
}

function makeAuditId() {
  return `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowToAuditEvent(row: AuditEventRow): AuditEvent {
  const metadata = row.metadata ?? {};
  const severity = typeof metadata.severity === "string" && ["info", "warning", "critical"].includes(metadata.severity)
    ? metadata.severity as AuditSeverity
    : "info";

  return {
    id: row.legacy_id || row.id,
    createdAt: new Date(row.created_at).toISOString(),
    actorRole: row.actor_role,
    actorId: row.actor_id ?? undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    severity,
    metadata,
    // Change-set and device context are persisted inside metadata (no schema
    // change); surface them as typed fields for the reviewer UI.
    changes: isRecord(metadata.changes) ? (metadata.changes as AuditChangeSet) : undefined,
    device: isRecord(metadata.device) ? (metadata.device as AuditDeviceContext) : undefined
  };
}

// Return type is intentionally inferred (not annotated as AuditDeviceContext):
// ip/userAgent always resolve via fallbacks, so callers that need them as plain
// strings (e.g. session creation) keep that guarantee. Still assignable to the
// optional-field AuditDeviceContext when passed as `device`.
export function auditRequestMetadata(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  let path: string | undefined;
  try {
    path = new URL(request.url).pathname;
  } catch {
    path = undefined;
  }
  return {
    ip: forwardedFor || request.headers.get("x-real-ip") || "local",
    userAgent: request.headers.get("user-agent") || "unknown",
    method: request.method,
    path
  };
}

async function listAuditEventsFromDatabase(limit: number) {
  const result = await query<AuditEventRow>(
    `select legacy_id, id::text, created_at::text, actor_role, actor_id, action, entity_type, entity_id, metadata
     from audit_events
     order by created_at desc
     limit $1`,
    [Math.max(1, Math.min(limit, maxEvents))]
  );
  return result.rows.map(rowToAuditEvent);
}

async function recordAuditEventInDatabase(event: AuditEvent) {
  await query(
    `insert into audit_events (legacy_id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
     on conflict (legacy_id) do nothing`,
    [
      event.id,
      event.actorId ?? null,
      event.actorRole,
      event.action,
      event.entityType,
      event.entityId,
      JSON.stringify({
        ...event.metadata,
        severity: event.severity
      }),
      event.createdAt
    ]
  );
}

export async function listAuditEvents(limit = 250) {
  if (shouldUseDatabaseStores()) {
    return listAuditEventsFromDatabase(limit);
  }

  return getStore().events.slice(0, limit);
}

export async function recordAuditEvent(input: AuditInput) {
  const changes = input.changes
    ?? (input.before || input.after ? computeAuditChanges(input.before, input.after) : undefined);

  // Change-set and device context live inside metadata so the relational
  // audit_events table needs no new columns (backward-compatible).
  const metadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    ...(changes ? { changes } : {}),
    ...(input.device ? { device: input.device } : {})
  };

  const event: AuditEvent = {
    id: makeAuditId(),
    createdAt: new Date().toISOString(),
    actorRole: input.actorRole,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity ?? "info",
    metadata,
    changes,
    device: input.device
  };

  if (shouldUseDatabaseStores()) {
    await recordAuditEventInDatabase(event);
    return event;
  }

  const store = getStore();
  store.events = [event, ...store.events].slice(0, maxEvents);
  writeStoreToDisk(store);
  return event;
}
