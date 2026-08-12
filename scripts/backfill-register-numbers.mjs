#!/usr/bin/env node
/**
 * Issue register numbers (IPD-YYYY-00001 / OPD-YYYY-00001) to encounters
 * recorded before those fields existed, with an audit record.
 *
 * Until this runs, those records fall back to displaying their daily token —
 * the queue position from the morning they were created, which repeats every
 * day and so cannot tell two encounters apart. This assigns each one a real
 * number instead.
 *
 * Safety properties:
 *   - Dry run unless --apply is passed; the plan prints in full either way.
 *   - Idempotent. A record that already holds a number is never touched and
 *     never renumbered, so a half-finished run is safe to repeat.
 *   - Numbers are issued in encounter order (oldest first) and scoped to the
 *     year the encounter actually happened, so the register reads
 *     chronologically rather than by whenever this script was run.
 *   - Continues each year's series from the highest number already issued, via
 *     the same lib/id.ts nextSerialNumber() the running app uses, so a number
 *     the app handed out while the plan was being made is never reused.
 *   - Cancelled and completed encounters are numbered too: they are real
 *     entries in the register, and skipping them would leave gaps that look
 *     like missing records rather than closed ones.
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-register-numbers.mjs \
 *     --series opd \
 *     --reason "Backfill for visit-number rollout" \
 *     --actor "amit" [--apply]
 *
 *   --series accepts ipd, opd, or all (default).
 */

import { randomUUID } from "node:crypto";
import pg from "pg";
// Imported rather than reimplemented so the backfill and the running app can
// never drift into two different numbering rules. Node strips the types at
// load; the module is plain TypeScript with no runtime-only syntax.
import { nextSerialNumber } from "../lib/id.ts";

/**
 * One register. `collection` is the array inside the store document, `field`
 * the number being issued, and `label` what each row is called when printed.
 */
const REGISTERS = {
  ipd: {
    prefix: "IPD",
    storeKey: "ipd-beds",
    collection: "admissions",
    field: "admissionNo",
    label: "admission",
    auditAction: "ipd.admission_numbers.backfilled",
    entityType: "ipd_admission"
  },
  opd: {
    prefix: "OPD",
    storeKey: "opd-queue",
    collection: "visits",
    field: "visitNo",
    label: "visit",
    auditAction: "opd.visit_numbers.backfilled",
    entityType: "opd_visit"
  },
  lab: {
    prefix: "LAB",
    storeKey: "lab-orders",
    collection: "orders",
    field: "orderNo",
    label: "lab order",
    auditAction: "lab.order_numbers.backfilled",
    entityType: "lab_order"
  },
  pharmacy: {
    prefix: "PHA",
    storeKey: "pharmacy-dispenses",
    collection: "dispenses",
    field: "dispenseNo",
    label: "pharmacy dispense",
    auditAction: "pharmacy.dispense_numbers.backfilled",
    entityType: "pharmacy_dispense"
  },
  procedure: {
    prefix: "PRC",
    storeKey: "procedure-schedules",
    collection: "schedules",
    field: "scheduleNo",
    label: "procedure",
    auditAction: "procedure.schedule_numbers.backfilled",
    entityType: "procedure_schedule"
  },
  referral: {
    prefix: "REF",
    storeKey: "external-referrals",
    collection: "referrals",
    field: "referralNo",
    label: "external referral",
    auditAction: "referral.numbers.backfilled",
    entityType: "external_referral"
  }
};

/**
 * Every child register also carries `visitNo`, denormalized from the OPD visit
 * it came out of. Backfilled in the same pass, resolved through `visitId`, so a
 * historical lab order can still say which consultation ordered it.
 */
const CHILD_REGISTERS = new Set(["lab", "pharmacy", "procedure", "referral"]);

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

const reason = args.get("reason");
const actor = args.get("actor") || "system";
const apply = args.get("apply") === "true";
const series = (args.get("series") || "all").toLowerCase();

if (!reason) {
  console.error("Missing --reason. Every write to a clinical register needs one recorded against it.");
  process.exit(1);
}

// OPD first when running everything: the child registers copy visitNo from the
// visits, so those have to be numbered before anything reads them.
const selected = series === "all" ? Object.keys(REGISTERS) : [series];
for (const key of selected) {
  if (!REGISTERS[key]) {
    console.error(`Unknown --series "${key}". Expected one of: ipd, opd, all.`);
    process.exit(1);
  }
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

/**
 * visitId -> visitNo for every OPD visit, including numbers this run is about
 * to issue but has not committed yet. Child registers denormalize visitNo, and
 * within one --apply run the visits document is only written at commit time —
 * so reading it back from the database here would hand the children the stale
 * value they are meant to be fixing.
 */
async function buildVisitNumberMap(opdPlan) {
  const result = await pool.query("select doc from store_documents where key = 'opd-queue'");
  const visits = result.rows[0]?.doc?.visits;
  const map = new Map();
  if (Array.isArray(visits)) {
    for (const visit of visits) {
      if (typeof visit.visitNo === "string" && visit.visitNo) map.set(visit.id, visit.visitNo);
    }
  }
  for (const { record, number } of opdPlan ?? []) map.set(record.id, number);
  return map;
}

async function backfill(register, visitNumbers) {
  const { prefix, storeKey, collection, field, label } = register;
  console.log(`\n=== ${label} register (${prefix}) ===`);

  const result = await pool.query("select doc from store_documents where key = $1", [storeKey]);
  const doc = result.rows[0]?.doc;
  if (!Array.isArray(doc?.[collection])) {
    console.log(`  ${storeKey} document not found or holds no ${collection} — nothing to do.`);
    return { written: 0 };
  }

  const records = doc[collection];
  const pending = records
    .filter((record) => typeof record[field] !== "string" || record[field] === "")
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));

  // Child registers also carry the visit number. Checked across every record,
  // not just unnumbered ones: a record can already hold its own number and
  // still be missing the encounter it came from.
  const visitFixups = [];
  if (visitNumbers) {
    for (const record of records) {
      if (typeof record.visitNo === "string" && record.visitNo) continue;
      const visitNo = visitNumbers.get(record.visitId);
      if (visitNo) visitFixups.push({ record, visitNo });
    }
  }

  console.log(`  total: ${records.length} | already numbered: ${records.length - pending.length} | to number: ${pending.length}`);
  if (visitNumbers) console.log(`  visit links to fill: ${visitFixups.length}`);
  if (pending.length === 0 && visitFixups.length === 0) return { written: 0 };

  // Seeded with every number already issued, and grown as the plan is built,
  // so each record continues its own year's series.
  const issued = records.map((record) => record[field]).filter((value) => typeof value === "string");
  const plan = [];
  for (const record of pending) {
    const createdOn = new Date(record.createdAt);
    if (Number.isNaN(createdOn.getTime())) throw new Error(`${label} ${record.id} has an unreadable createdAt: ${record.createdAt}`);
    const number = nextSerialNumber(prefix, issued, createdOn);
    issued.push(number);
    plan.push({ record, number });
  }

  const assigned = new Set(plan.map((entry) => entry.number));
  if (assigned.size !== plan.length) throw new Error(`Planned ${label} numbers are not unique — refusing to write.`);
  for (const record of records) {
    if (typeof record[field] === "string" && assigned.has(record[field])) {
      throw new Error(`Planned number ${record[field]} is already held by ${record.id} — refusing to write.`);
    }
  }

  // Long registers print head and tail rather than thousands of lines; the
  // count above is the number that matters, and the ends show the range.
  const preview = plan.length > 20 ? [...plan.slice(0, 10), null, ...plan.slice(-10)] : plan;
  for (const entry of preview) {
    if (!entry) {
      console.log(`     … ${plan.length - 20} more …`);
      continue;
    }
    const { record, number } = entry;
    console.log(`  ${number}  ${String(record.createdAt).slice(0, 10)}  ${record.patientName} (${record.status ?? "—"}, was token ${record.token})`);
  }

  return { plan, visitFixups, doc, register };
}

async function commit(pendingWrites) {
  const client = await pool.connect();
  try {
    // One transaction across every register touched: the numbers and the audit
    // entries are a single fact. A register that gains numbers with no record
    // of who issued them is what this script exists to avoid producing.
    await client.query("begin");
    for (const { plan, visitFixups, doc, register } of pendingWrites) {
      for (const { record, number } of plan) record[register.field] = number;
      for (const { record, visitNo } of visitFixups) record.visitNo = visitNo;
      await client.query(
        "update store_documents set doc = $1::jsonb, updated_at = now() where key = $2",
        [JSON.stringify(doc), register.storeKey]
      );
      await client.query(
        `insert into audit_events (legacy_id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
         on conflict (legacy_id) do nothing`,
        [
          randomUUID(),
          actor,
          "admin",
          register.auditAction,
          register.entityType,
          `${plan.length} ${register.collection}`,
          JSON.stringify({
            severity: "info",
            reason,
            source: "scripts/backfill-register-numbers.mjs",
            changes: {
              [register.field]: {
                before: plan.map(({ record }) => ({ id: record.id, [register.field]: null })),
                after: plan.map(({ record, number }) => ({ id: record.id, [register.field]: number }))
              },
              ...(visitFixups.length
                ? {
                    visitNo: {
                      before: visitFixups.map(({ record }) => ({ id: record.id, visitNo: null })),
                      after: visitFixups.map(({ record, visitNo }) => ({ id: record.id, visitNo }))
                    }
                  }
                : {})
            }
          }),
          new Date().toISOString()
        ]
      );
      console.log(`  ${register.label}: ${plan.length} numbered${visitFixups.length ? `, ${visitFixups.length} visit link(s) filled` : ""}.`);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`Reason: ${reason}`);
  const pendingWrites = [];

  // OPD runs before the child registers so their visit links can be resolved
  // against numbers this same run is issuing, not just what is already stored.
  const ordered = [...selected].sort((left, right) => Number(CHILD_REGISTERS.has(left)) - Number(CHILD_REGISTERS.has(right)));
  let visitNumbers = null;

  for (const key of ordered) {
    if (CHILD_REGISTERS.has(key) && !visitNumbers) {
      visitNumbers = await buildVisitNumberMap(pendingWrites.find((entry) => entry.register.prefix === "OPD")?.plan);
    }
    const outcome = await backfill(REGISTERS[key], CHILD_REGISTERS.has(key) ? visitNumbers : undefined);
    if (outcome.plan?.length || outcome.visitFixups?.length) pendingWrites.push(outcome);
  }

  if (pendingWrites.length === 0) {
    console.log("\nNothing to do — every record already carries a number.");
    return;
  }

  if (!apply) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply to commit.");
    return;
  }

  console.log("\nApplying:");
  await commit(pendingWrites);
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
