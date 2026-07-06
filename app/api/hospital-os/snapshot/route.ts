import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createAnalyticsSnapshot, createHospitalOsDashboardMetrics, createHospitalOsNavBadges, createHospitalOsTrend } from "@/lib/analytics";
import { listAppointments } from "@/lib/appointment-store";
import { patientFlowRows, type PatientFlowRow } from "@/lib/hospital-os-data";
import { listOpdVisits } from "@/lib/opd-store";
import { findPatientByPhone } from "@/lib/patient-store";
import { doctor } from "@/lib/site-data";

function riskFor(priority?: string): PatientFlowRow["risk"] {
  const value = (priority || "").toLowerCase();
  if (value.includes("urgent") || value.includes("emergency")) return "High";
  if (value.includes("priority")) return "Moderate";
  return "Low";
}

/** Live patient flow: today's OPD queue plus appointment requests not yet converted to visits. */
async function livePatientFlowRows(): Promise<PatientFlowRow[]> {
  const now = Date.now();
  const visits = (await listOpdVisits());
  const convertedAppointmentIds = new Set(visits.map((visit) => visit.appointmentId));
  const rows: PatientFlowRow[] = [];

  for (const visit of visits) {
    if (visit.status === "Cancelled") continue;
    const patient = (await findPatientByPhone(visit.phone));
    const inFlight = visit.status === "Waiting" || visit.status === "In Consultation";
    const status: PatientFlowRow["status"] =
      visit.status === "Waiting"
        ? "Vitals Pending"
        : visit.status === "In Consultation"
          ? "In Consultation"
          : visit.billingStatus === "Paid"
            ? "Discharged"
            : "Billing Hold";

    rows.push({
      id: visit.id,
      uhid: visit.uhid || visit.token,
      patient: visit.patientName,
      age: Number(patient?.age) || 0,
      status,
      doctor: doctor.name,
      department: visit.service,
      billing: visit.paymentMethod === "Insurance" ? "Insurance" : visit.billingStatus === "Paid" ? "Paid" : "Open",
      insurance: visit.paymentMethod === "Insurance" ? "Insurance" : "Self pay",
      waitMinutes: inFlight ? Math.max(0, Math.min(600, Math.round((now - new Date(visit.createdAt).getTime()) / 60000))) : 0,
      risk: riskFor(visit.priority),
      lastActivity: `OPD ${visit.status} · Token ${visit.token}`,
      phone: visit.phone
    });
  }

  for (const appointment of (await listAppointments())) {
    if (convertedAppointmentIds.has(appointment.id)) continue;
    if (appointment.status === "Cancelled" || appointment.status === "Completed") continue;
    rows.push({
      id: appointment.id,
      uhid: appointment.uhid || appointment.id,
      patient: appointment.name,
      age: Number(appointment.age) || 0,
      status: "Scheduled",
      doctor: doctor.name,
      department: appointment.service,
      billing: "Open",
      insurance: "Self pay",
      waitMinutes: 0,
      risk: riskFor(appointment.priority),
      lastActivity: `Appointment ${appointment.status.toLowerCase()} · ${appointment.timeSlot || "Flexible"}`,
      phone: appointment.phone
    });
  }

  return rows;
}

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "hospital_os.snapshot.viewed",
    entityType: "hospital_os",
    entityId: "snapshot",
    metadata: auditRequestMetadata(request)
  });

  const liveRows = await livePatientFlowRows();
  // Demo rows only pad non-production preview environments; a live hospital
  // dashboard must never show fabricated patients.
  const rows = liveRows.length ? liveRows : process.env.NODE_ENV === "production" ? [] : patientFlowRows;

  // One aggregation pass feeds metrics, trend and badges (was 2× full store scans).
  const analytics = await createAnalyticsSnapshot();

  return NextResponse.json({
    ok: true,
    rows,
    metrics: await createHospitalOsDashboardMetrics(analytics),
    trend: await createHospitalOsTrend(analytics),
    navBadges: createHospitalOsNavBadges(analytics),
    generatedAt: new Date().toISOString()
  });
}
