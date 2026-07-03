import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const outIndex = process.argv.indexOf("--out");
const outFile = outIndex >= 0 && process.argv[outIndex + 1] ? process.argv[outIndex + 1] : "database/local-data-export.sql";

function readJson(fileName, fallback) {
  const filePath = join(root, ".data", fileName);
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function q(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function n(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}

function d(value) {
  if (!value) return "NULL";
  return q(String(value).slice(0, 10));
}

function ts(value) {
  return value ? q(value) : "now()";
}

function nts(value) {
  return value ? q(value) : "NULL";
}

function arr(values) {
  const items = Array.isArray(values) ? values : [];
  return `ARRAY[${items.map(q).join(", ")}]::text[]`;
}

function json(value) {
  return `${q(JSON.stringify(value ?? {}))}::jsonb`;
}

function ref(table, legacyId) {
  return legacyId ? `(SELECT id FROM ${table} WHERE legacy_id = ${q(legacyId)} LIMIT 1)` : "NULL";
}

function insert(table, columns, values, conflict = "legacy_id") {
  return [
    `INSERT INTO ${table} (${columns.join(", ")})`,
    `VALUES (${values.join(", ")})`,
    conflict ? `ON CONFLICT (${conflict}) DO NOTHING;` : ";"
  ].join(" ");
}

const patients = readJson("patients.json", { patients: [] }).patients || [];
const appointments = readJson("appointments.json", { appointments: [] }).appointments || [];
const visits = readJson("opd-queue.json", { visits: [] }).visits || [];
const inventory = readJson("inventory.json", { items: [] }).items || [];
const pharmacy = readJson("pharmacy-dispenses.json", { dispenses: [] }).dispenses || [];
const lab = readJson("lab-orders.json", { orders: [] }).orders || [];
const procedures = readJson("procedure-schedules.json", { schedules: [] }).schedules || [];
const ipd = readJson("ipd-beds.json", { beds: [], admissions: [] });
const finance = readJson("finance.json", { claims: [], entries: [] });
const hr = readJson("hr.json", { staff: [], attendance: [] });
const communication = readJson("communication.json", { logs: [] }).logs || [];
const ai = readJson("ai-reviews.json", { reviews: [] }).reviews || [];
const automation = readJson("automation.json", { tasks: [] }).tasks || [];
const cmsStore = readJson("cms-content.json", { items: [], revisions: [] });
const cms = cmsStore.items || [];
const cmsRevisions = cmsStore.revisions || [];
const audit = readJson("audit-events.json", { events: [] }).events || [];

const statements = [
  "-- Generated from local .data JSON stores.",
  "-- Apply database/schema.sql before this file.",
  "BEGIN;"
];

for (const item of cms) {
  statements.push(insert("cms_content_items", [
    "legacy_id", "content_type", "status", "title", "slug", "summary", "seo_title", "seo_description",
    "media_url", "owner", "notes", "published_at", "created_at", "updated_at"
  ], [
    q(item.id), q(item.type), q(item.status || "Draft"), q(item.title), q(item.slug), q(item.summary), q(item.seoTitle),
    q(item.seoDescription), q(item.mediaUrl), q(item.owner), q(item.notes), nts(item.publishedAt), ts(item.createdAt), ts(item.updatedAt)
  ]));
}

for (const revision of cmsRevisions) {
  statements.push(insert("cms_content_revisions", [
    "legacy_id", "content_item_id", "content_item_legacy_id", "version", "action", "status", "title", "slug",
    "summary", "seo_title", "seo_description", "media_url", "owner", "notes", "created_at"
  ], [
    q(revision.id), ref("cms_content_items", revision.itemId), q(revision.itemId), n(revision.version), q(revision.action),
    q(revision.status), q(revision.title), q(revision.slug), q(revision.summary), q(revision.seoTitle),
    q(revision.seoDescription), q(revision.mediaUrl), q(revision.owner), q(revision.notes), ts(revision.createdAt)
  ]));
}

for (const patient of patients) {
  statements.push(insert("patients", [
    "legacy_id", "uhid", "status", "name", "phone", "alternate_phone", "email", "age", "gender", "blood_group",
    "address", "city", "emergency_contact", "allergies", "chronic_conditions", "current_medicines", "notes",
    "last_visit_at", "created_at", "updated_at"
  ], [
    q(patient.id), q(patient.uhid), q(patient.status || "Active"), q(patient.name), q(patient.phone), q(patient.alternatePhone),
    q(patient.email), q(patient.age), q(patient.gender), q(patient.bloodGroup), q(patient.address), q(patient.city),
    q(patient.emergencyContact), q(patient.allergies), q(patient.chronicConditions), q(patient.currentMedicines), q(patient.notes),
    nts(patient.lastVisitAt), ts(patient.createdAt), ts(patient.updatedAt)
  ]));
}

for (const appointment of appointments) {
  statements.push(insert("appointments", [
    "legacy_id", "patient_id", "uhid", "status", "name", "phone", "email", "age", "gender", "patient_type",
    "contact_method", "service", "preferred_date", "time_slot", "priority", "symptoms", "duration", "medicines",
    "assistance", "report", "message", "created_at", "updated_at"
  ], [
    q(appointment.id), ref("patients", appointment.patientId), q(appointment.uhid), q(appointment.status || "New"), q(appointment.name),
    q(appointment.phone), q(appointment.email), q(appointment.age), q(appointment.gender), q(appointment.patientType),
    q(appointment.contactMethod), q(appointment.service), d(appointment.date), q(appointment.timeSlot), q(appointment.priority),
    arr(appointment.symptoms), q(appointment.duration), q(appointment.medicines), q(appointment.assistance), q(appointment.report),
    q(appointment.message), ts(appointment.createdAt), ts(appointment.createdAt)
  ]));
}

for (const visit of visits) {
  statements.push(insert("opd_visits", [
    "legacy_id", "token", "appointment_id", "patient_id", "uhid", "status", "patient_name", "phone", "service",
    "priority", "symptoms", "billing_status", "estimated_amount", "payment_method", "receipt_id", "paid_at",
    "notes", "clinical_note", "prescription", "advice", "follow_up_date", "created_at", "updated_at"
  ], [
    q(visit.id), q(visit.token), ref("appointments", visit.appointmentId), ref("patients", visit.patientId), q(visit.uhid),
    q(visit.status || "Waiting"), q(visit.patientName), q(visit.phone), q(visit.service), q(visit.priority), arr(visit.symptoms),
    q(visit.billingStatus || "Not Started"), n(visit.estimatedAmount), q(visit.paymentMethod), q(visit.receiptId), nts(visit.paidAt),
    q(visit.notes), q(visit.clinicalNote), q(visit.prescription), q(visit.advice), d(visit.followUpDate), ts(visit.createdAt), ts(visit.createdAt)
  ]));
}

for (const item of inventory) {
  statements.push(insert("inventory_items", [
    "legacy_id", "name", "category", "quantity", "reorder_level", "unit", "vendor", "last_updated_at"
  ], [
    q(item.id), q(item.name), q(item.category), n(item.quantity), n(item.reorderLevel), q(item.unit), q(item.vendor), ts(item.lastUpdatedAt)
  ]));
}

for (const record of pharmacy) {
  statements.push(insert("pharmacy_dispenses", [
    "legacy_id", "status", "visit_id", "token", "patient_id", "uhid", "patient_name", "phone", "service",
    "items", "subtotal", "discount", "total", "payment_status", "payment_method", "notes", "created_at", "updated_at"
  ], [
    q(record.id), q(record.status || "Draft"), ref("opd_visits", record.visitId), q(record.token), ref("patients", record.patientId),
    q(record.uhid), q(record.patientName), q(record.phone), q(record.service), json(record.items || []), n(record.subtotal),
    n(record.discount), n(record.total), q(record.paymentStatus || "Unpaid"), q(record.paymentMethod), q(record.notes),
    ts(record.createdAt), ts(record.updatedAt)
  ]));
}

for (const order of lab) {
  statements.push(insert("lab_orders", [
    "legacy_id", "visit_id", "token", "patient_id", "uhid", "patient_name", "phone", "service", "tests",
    "priority", "status", "sample_type", "result_summary", "report_reference", "amount", "payment_status",
    "notes", "created_at", "updated_at"
  ], [
    q(order.id), ref("opd_visits", order.visitId), q(order.token), ref("patients", order.patientId), q(order.uhid),
    q(order.patientName), q(order.phone), q(order.service), arr(order.tests), q(order.priority || "Routine"),
    q(order.status || "Ordered"), q(order.sampleType), q(order.resultSummary), q(order.reportReference), n(order.amount),
    q(order.paymentStatus || "Unpaid"), q(order.notes), ts(order.createdAt), ts(order.updatedAt)
  ]));
}

for (const procedure of procedures) {
  statements.push(insert("procedure_schedules", [
    "legacy_id", "visit_id", "token", "patient_id", "uhid", "patient_name", "phone", "procedure_slug", "procedure_title",
    "scheduled_date", "scheduled_time", "room", "doctor", "anesthesia_plan", "priority", "status", "checklist",
    "findings", "complications", "notes", "created_at", "updated_at"
  ], [
    q(procedure.id), ref("opd_visits", procedure.visitId), q(procedure.token), ref("patients", procedure.patientId), q(procedure.uhid),
    q(procedure.patientName), q(procedure.phone), q(procedure.procedureSlug), q(procedure.procedureTitle), d(procedure.scheduledDate),
    q(procedure.scheduledTime), q(procedure.room), q(procedure.doctor), q(procedure.anesthesiaPlan), q(procedure.priority || "Routine"),
    q(procedure.status || "Planned"), json(procedure.checklist || {}), q(procedure.findings), q(procedure.complications),
    q(procedure.notes), ts(procedure.createdAt), ts(procedure.updatedAt)
  ]));
}

for (const bed of ipd.beds || []) {
  statements.push(insert("hospital_beds", [
    "legacy_id", "ward", "label", "status", "daily_rate", "notes"
  ], [
    q(bed.id), q(bed.ward), q(bed.label), q(bed.status || "Vacant"), n(bed.dailyRate), q(bed.notes)
  ]));
}

for (const admission of ipd.admissions || []) {
  statements.push(insert("ipd_admissions", [
    "legacy_id", "visit_id", "patient_id", "uhid", "token", "patient_name", "phone", "bed_id", "bed_label", "ward",
    "admission_type", "admitting_doctor", "diagnosis", "status", "care_plan", "nursing_notes", "diet_advice",
    "deposit_amount", "discharge_summary", "discharged_at", "created_at", "updated_at"
  ], [
    q(admission.id), ref("opd_visits", admission.visitId), ref("patients", admission.patientId), q(admission.uhid), q(admission.token),
    q(admission.patientName), q(admission.phone), ref("hospital_beds", admission.bedId), q(admission.bedLabel), q(admission.ward),
    q(admission.admissionType || "Planned"), q(admission.admittingDoctor), q(admission.diagnosis), q(admission.status || "Admitted"),
    q(admission.carePlan), q(admission.nursingNotes), q(admission.dietAdvice), n(admission.depositAmount), q(admission.dischargeSummary),
    nts(admission.dischargedAt), ts(admission.createdAt), ts(admission.updatedAt)
  ]));
}

for (const claim of finance.claims || []) {
  statements.push(insert("insurance_claims", [
    "legacy_id", "admission_id", "visit_id", "patient_id", "uhid", "patient_name", "phone", "insurer", "tpa",
    "policy_number", "claim_number", "requested_amount", "approved_amount", "settled_amount", "status", "documents",
    "notes", "created_at", "updated_at"
  ], [
    q(claim.id), ref("ipd_admissions", claim.admissionId), ref("opd_visits", claim.visitId), ref("patients", claim.patientId),
    q(claim.uhid), q(claim.patientName), q(claim.phone), q(claim.insurer), q(claim.tpa), q(claim.policyNumber),
    q(claim.claimNumber), n(claim.requestedAmount), n(claim.approvedAmount), n(claim.settledAmount), q(claim.status || "Draft"),
    q(claim.documents), q(claim.notes), ts(claim.createdAt), ts(claim.updatedAt)
  ]));
}

for (const entry of finance.entries || []) {
  statements.push(insert("account_entries", [
    "legacy_id", "entry_date", "type", "category", "amount", "method", "reference", "party", "notes", "created_at", "updated_at"
  ], [
    q(entry.id), d(entry.date), q(entry.type), q(entry.category), n(entry.amount), q(entry.method || "Cash"), q(entry.reference),
    q(entry.party), q(entry.notes), ts(entry.createdAt), ts(entry.updatedAt)
  ]));
}

for (const member of hr.staff || []) {
  statements.push(insert("staff_members", [
    "legacy_id", "status", "name", "phone", "email", "role", "department", "shift", "joining_date", "salary",
    "permissions", "emergency_contact", "notes", "created_at", "updated_at"
  ], [
    q(member.id), q(member.status || "Active"), q(member.name), q(member.phone), q(member.email), q(member.role),
    q(member.department), q(member.shift || "General"), d(member.joiningDate), n(member.salary), arr(member.permissions),
    q(member.emergencyContact), q(member.notes), ts(member.createdAt), ts(member.updatedAt)
  ]));
}

for (const attendance of hr.attendance || []) {
  statements.push(insert("attendance_records", [
    "legacy_id", "staff_id", "staff_name", "attendance_date", "status", "check_in", "check_out", "notes", "created_at", "updated_at"
  ], [
    q(attendance.id), ref("staff_members", attendance.staffId), q(attendance.staffName), d(attendance.date), q(attendance.status || "Present"),
    q(attendance.checkIn), q(attendance.checkOut), q(attendance.notes), ts(attendance.createdAt), ts(attendance.updatedAt)
  ], "legacy_id"));
}

for (const log of communication) {
  statements.push(insert("communication_logs", [
    "legacy_id", "patient_id", "uhid", "patient_name", "phone", "channel", "template", "status", "subject", "message",
    "scheduled_for", "sent_at", "owner", "notes", "created_at", "updated_at"
  ], [
    q(log.id), ref("patients", log.patientId), q(log.uhid), q(log.patientName), q(log.phone), q(log.channel), q(log.template),
    q(log.status || "Draft"), q(log.subject), q(log.message), nts(log.scheduledFor), nts(log.sentAt), q(log.owner), q(log.notes),
    ts(log.createdAt), ts(log.updatedAt)
  ]));
}

for (const review of ai) {
  statements.push(insert("ai_case_reviews", [
    "legacy_id", "source", "source_id", "patient_id", "uhid", "patient_name", "phone", "service", "urgency", "route",
    "summary", "flags", "preparation", "reception_script", "safety_note", "doctor_review_note", "reviewed_by",
    "reviewed_at", "status", "created_at", "updated_at"
  ], [
    q(review.id), q(review.source), q(review.sourceId), ref("patients", review.patientId), q(review.uhid), q(review.patientName),
    q(review.phone), q(review.service), q(review.urgency), q(review.route), q(review.summary), arr(review.flags),
    arr(review.preparation), q(review.receptionScript), q(review.safetyNote), q(review.doctorReviewNote), q(review.reviewedBy),
    nts(review.reviewedAt), q(review.status || "Needs Review"), ts(review.createdAt), ts(review.updatedAt)
  ]));
}

for (const task of automation) {
  statements.push(insert("automation_tasks", [
    "legacy_id", "task_key", "due_at", "type", "status", "priority", "title", "description", "source_id", "patient_id",
    "uhid", "patient_name", "phone", "owner", "action_url", "notes", "created_at", "updated_at"
  ], [
    q(task.id), q(task.key || task.id), d(task.dueAt), q(task.type), q(task.status || "Open"), q(task.priority || "Normal"),
    q(task.title), q(task.description), q(task.sourceId), ref("patients", task.patientId), q(task.uhid), q(task.patientName),
    q(task.phone), q(task.owner), q(task.actionUrl), q(task.notes), ts(task.createdAt), ts(task.updatedAt)
  ], "task_key"));
}

for (const event of audit) {
  statements.push(insert("audit_events", [
    "legacy_id", "actor_id", "actor_role", "action", "entity_type", "entity_id", "metadata", "created_at"
  ], [
    q(event.id), q(event.actorId), q(event.actorRole || "system"), q(event.action), q(event.entityType), q(event.entityId),
    json({ ...(event.metadata || {}), severity: event.severity || "info" }), ts(event.createdAt)
  ], "legacy_id"));
}

statements.push("COMMIT;");

mkdirSync(dirname(join(root, outFile)), { recursive: true });
writeFileSync(join(root, outFile), `${statements.join("\n")}\n`);
const insertCount = statements.filter((statement) => statement.startsWith("INSERT INTO ")).length;
console.log(`Wrote ${outFile} with ${insertCount} insert statements.`);
