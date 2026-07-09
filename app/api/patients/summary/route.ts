import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listPatientAppointments } from "@/lib/appointment-store";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { buildPatientTimeline } from "@/lib/clinical/patient-timeline";
import { listPatientIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { findPatientByPhone } from "@/lib/patient-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function amountValue(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * One-call patient context for the Global Patient Drawer (Track 2.1):
 * identity + safety fields, live clinical state and financial position,
 * aggregated from the same stores every module already writes to.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim() ?? "";
  const key = normalizePhone(phone);
  if (key.length < 6) {
    return NextResponse.json({ ok: false, error: "A valid patient phone number is required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "patient.summary.viewed",
    entityType: "patient",
    entityId: key,
    device: auditRequestMetadata(request)
  });

  const [patient, appointments, visits, admissions, allLabOrders, allDispenses, timeline] = await Promise.all([
    findPatientByPhone(phone),
    listPatientAppointments(phone),
    listPatientOpdVisits(phone),
    listPatientIpdAdmissions(phone),
    listLabOrders(),
    listPharmacyDispenses(),
    buildPatientTimeline(phone)
  ]);

  const labOrders = allLabOrders.filter((order) => normalizePhone(order.phone) === key);
  const dispenses = allDispenses.filter((record) => normalizePhone(record.phone) === key && record.status !== "Cancelled");

  const activeAdmission = admissions.find((admission) => admission.status === "Admitted") ?? null;
  const nextAppointment =
    appointments.find((appointment) => appointment.status === "Confirmed" || appointment.status === "New" || appointment.status === "Contacted") ?? null;

  const unpaidVisits = visits.filter((visit) => visit.status !== "Cancelled" && visit.billingStatus !== "Paid");
  const unpaidLab = labOrders.filter((order) => order.status !== "Cancelled" && order.paymentStatus === "Unpaid");
  const unpaidPharmacy = dispenses.filter((record) => record.paymentStatus === "Unpaid");
  const outstandingAmount =
    unpaidVisits.reduce((sum, visit) => sum + amountValue(visit.estimatedAmount), 0) +
    unpaidLab.reduce((sum, order) => sum + Number(order.amount || 0), 0) +
    unpaidPharmacy.reduce((sum, record) => sum + record.total, 0);

  const usesInsurance =
    visits.some((visit) => visit.paymentMethod === "Insurance") || dispenses.some((record) => record.paymentMethod === "Insurance");

  return NextResponse.json({
    ok: true,
    summary: {
      patient,
      activeAdmission,
      nextAppointment,
      recentVisits: visits.slice(0, 5),
      recentLabOrders: labOrders.slice(0, 5),
      criticalUnacknowledged: labOrders.filter(
        (order) => order.criticalFlag && !order.criticalAcknowledgedAt && order.status !== "Cancelled"
      ).length,
      outstanding: {
        amount: outstandingAmount,
        unpaidVisits: unpaidVisits.length,
        unpaidLabOrders: unpaidLab.length,
        unpaidPharmacy: unpaidPharmacy.length
      },
      usesInsurance,
      timeline: timeline.slice(-8).reverse()
    }
  });
}
