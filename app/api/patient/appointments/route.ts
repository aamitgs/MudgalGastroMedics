import { NextResponse } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { listPatientAppointments } from "@/lib/appointment-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { listPatientIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { listPatientInsuranceClaims } from "@/lib/finance-store";
import { listPatientLabOrders } from "@/lib/lab-store";
import { patientRecordsLookupSchema } from "@/lib/validation/patient-auth";

export async function POST(request: Request) {
  // Records are scoped to the verified patient session — the phone number is
  // never taken from the request body, so one patient cannot read another's
  // records by guessing a number.
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number to view your records." }, { status: 401 });
  }

  const parsed = patientRecordsLookupSchema.safeParse(await request.json().catch(() => ({})));
  const phone = session.phone;
  const requestId = parsed.success ? parsed.data.requestId : "";

  const appointments = (await listPatientAppointments(phone, requestId || undefined)).map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patientId,
    uhid: appointment.uhid,
    createdAt: appointment.createdAt,
    status: appointment.status,
    name: appointment.name,
    phone: appointment.phone,
    service: appointment.service,
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    priority: appointment.priority,
    symptoms: appointment.symptoms,
    report: appointment.report,
    message: appointment.message
  }));

  const visits = (await listPatientOpdVisits(phone)).map((visit) => ({
    id: visit.id,
    token: visit.token,
    appointmentId: visit.appointmentId,
    patientId: visit.patientId,
    uhid: visit.uhid,
    createdAt: visit.createdAt,
    status: visit.status,
    patientName: visit.patientName,
    phone: visit.phone,
    service: visit.service,
    priority: visit.priority,
    symptoms: visit.symptoms,
    billingStatus: visit.billingStatus,
    estimatedAmount: visit.estimatedAmount,
    paymentMethod: visit.paymentMethod,
    receiptId: visit.receiptId,
    paidAt: visit.paidAt,
    clinicalNote: visit.clinicalNote,
    prescription: visit.prescription,
    advice: visit.advice,
    followUpDate: visit.followUpDate
  }));

  const ipdAdmissions = (await listPatientIpdAdmissions(phone)).map((admission) => ({
    id: admission.id,
    status: admission.status,
    createdAt: admission.createdAt,
    dischargedAt: admission.dischargedAt,
    patientName: admission.patientName,
    uhid: admission.uhid,
    bedLabel: admission.bedLabel,
    ward: admission.ward,
    admittingDoctor: admission.admittingDoctor,
    assignedNurse: admission.assignedNurse,
    expectedDischargeDate: admission.expectedDischargeDate,
    diagnosis: admission.diagnosis,
    dischargeSummary: admission.dischargeSummary
  }));

  const vitals = (await Promise.all(ipdAdmissions.map((admission) => listVitals(admission.id)))).flat();

  const insuranceClaims = (await listPatientInsuranceClaims(phone)).map((claim) => ({
    id: claim.id,
    createdAt: claim.createdAt,
    insurer: claim.insurer,
    policyNumber: claim.policyNumber,
    claimNumber: claim.claimNumber,
    requestedAmount: claim.requestedAmount,
    approvedAmount: claim.approvedAmount,
    settledAmount: claim.settledAmount,
    status: claim.status
  }));

  // Deliberately minimal — no resultSummary/criticalFlag/criticalReasons here.
  // Raw critical lab values shown to a patient with no clinician mediating the
  // context is a real patient-safety risk (misread/panic); this only powers a
  // "your report is ready, please contact the hospital" pointer, never the
  // clinical content itself.
  const labOrders = (await listPatientLabOrders(phone)).map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    service: order.service,
    tests: order.tests,
    status: order.status
  }));

  return NextResponse.json({ ok: true, appointments, visits, ipdAdmissions, vitals, insuranceClaims, labOrders });
}
