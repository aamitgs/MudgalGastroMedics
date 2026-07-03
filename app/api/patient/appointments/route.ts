import { NextResponse } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { listPatientAppointments } from "@/lib/appointment-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { listPatientIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { listPatientInsuranceClaims } from "@/lib/finance-store";

export async function POST(request: Request) {
  // Records are scoped to the verified patient session — the phone number is
  // never taken from the request body, so one patient cannot read another's
  // records by guessing a number.
  const session = getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number to view your records." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = session.phone;
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";

  const appointments = listPatientAppointments(phone, requestId || undefined).map((appointment) => ({
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

  const visits = listPatientOpdVisits(phone).map((visit) => ({
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

  const ipdAdmissions = listPatientIpdAdmissions(phone).map((admission) => ({
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

  const vitals = ipdAdmissions.flatMap((admission) => listVitals(admission.id));

  const insuranceClaims = listPatientInsuranceClaims(phone).map((claim) => ({
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

  return NextResponse.json({ ok: true, appointments, visits, ipdAdmissions, vitals, insuranceClaims });
}
