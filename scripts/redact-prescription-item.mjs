#!/usr/bin/env node
/**
 * Remove a single prescription line from an OPD visit, with an audit record.
 *
 * Written for the cleanup of test text typed into a live patient record, but
 * kept general because it is the only safe way to do this class of edit: a
 * clinical record must never be changed by an ad-hoc UPDATE, and the audit
 * trail is a frozen contract (CLAUDE.md), so a bare SQL delete is not an
 * option even for junk data.
 *
 * Safety properties:
 *   - Dry run unless --apply is passed.
 *   - Targets one visit id + one prescription item id. No pattern matching, so
 *     it cannot sweep up a real prescription that happens to look similar.
 *   - Refuses to act if the stored line no longer matches --expect-medicine,
 *     so a record edited since the plan was made is never clobbered.
 *   - Writes an audit_events row with before/after, actor and reason, matching
 *     the shape lib/audit-store.ts uses (changes/device nest inside metadata).
 *
 * Usage:
 *   node --env-file=.env.local scripts/redact-prescription-item.mjs \
 *     --visit OPD-MRYVA6UO-6CB \
 *     --item e87a99fc-83e4-492f-a638-c67f8447e805 \
 *     --expect-medicine wewewfewf \
 *     --reason "Test text entered during pre-go-live testing" \
 *     --actor "amit" [--apply]
 */

import { randomUUID } from "node:crypto";
import pg from "pg";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
  } else {
    args.set(key, next);
    i += 1;
  }
}

const visitId = args.get("visit");
const itemId = args.get("item");
const expectMedicine = args.get("expect-medicine");
const reason = args.get("reason");
const actor = args.get("actor") || "system";
const apply = args.get("apply") === "true";

if (!visitId || !itemId || !expectMedicine || !reason) {
  console.error("Missing required flag. Need --visit, --item, --expect-medicine and --reason.");
  console.error("A reason is mandatory: an unexplained edit to a clinical record is worse than the junk it removes.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pass --env-file=.env.local.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 2
});

async function main() {
  const result = await pool.query("select doc from store_documents where key = 'opd-queue'");
  const doc = result.rows[0]?.doc;
  if (!doc?.visits) throw new Error("opd-queue document not found or malformed.");

  const visit = doc.visits.find((entry) => entry.id === visitId);
  if (!visit) throw new Error(`Visit ${visitId} not found.`);

  const items = visit.prescriptionItems ?? [];
  const target = items.find((entry) => entry.id === itemId);
  if (!target) {
    console.log(`Nothing to do: item ${itemId} is not on visit ${visitId} (already removed?).`);
    return;
  }

  if ((target.medicine ?? "") !== expectMedicine) {
    throw new Error(
      `Refusing to edit: item ${itemId} holds medicine "${target.medicine}", expected "${expectMedicine}". ` +
      "The record changed since this removal was planned — re-check it by hand."
    );
  }

  const before = { prescriptionItems: structuredClone(items) };
  const after = { prescriptionItems: items.filter((entry) => entry.id !== itemId) };

  console.log(`Visit    : ${visit.id}  (${visit.patientName}, UHID ${visit.uhid})`);
  console.log(`Removing : ${JSON.stringify(target)}`);
  console.log(`Remaining: ${after.prescriptionItems.length} prescription line(s)`);
  console.log(`Reason   : ${reason}`);

  if (!apply) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply to commit.");
    return;
  }

  const auditEvent = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    actorRole: "admin",
    actorId: actor,
    action: "opd.prescription.updated",
    entityType: "opd_visit",
    entityId: visit.id,
    metadata: {
      severity: "warning",
      reason,
      source: "scripts/redact-prescription-item.mjs",
      patientUhid: visit.uhid,
      changes: {
        prescriptionItems: { before: before.prescriptionItems, after: after.prescriptionItems }
      }
    }
  };

  const client = await pool.connect();
  try {
    // One transaction: the record edit and the audit entry are a single fact.
    // A cleanup that lands without its audit row is exactly the untraceable
    // clinical edit this script exists to avoid.
    await client.query("begin");
    visit.prescriptionItems = after.prescriptionItems;
    await client.query(
      "update store_documents set doc = $1::jsonb, updated_at = now() where key = 'opd-queue'",
      [JSON.stringify(doc)]
    );
    await client.query(
      `insert into audit_events (legacy_id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       on conflict (legacy_id) do nothing`,
      [
        auditEvent.id,
        auditEvent.actorId,
        auditEvent.actorRole,
        auditEvent.action,
        auditEvent.entityType,
        auditEvent.entityId,
        JSON.stringify(auditEvent.metadata),
        auditEvent.createdAt
      ]
    );
    await client.query("commit");
    console.log(`\nApplied. Audit event ${auditEvent.id} recorded.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(`\nFailed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
