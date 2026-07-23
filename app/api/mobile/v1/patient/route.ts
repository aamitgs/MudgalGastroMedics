import { listPatientAppointments } from "@/lib/appointment-store";
import { hasMobileToken, mobileOk, mobileUnauthorized } from "@/lib/mobile-api";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { findPatientByPhone } from "@/lib/patient-store";
import { mobilePatientLookupSchema } from "@/lib/validation/operations";

async function publicAppointment(phone: string, requestId?: string) {
  return (await listPatientAppointments(phone, requestId)).map((appointment) => ({
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
}

async function publicVisit(phone: string) {
  return (await listPatientOpdVisits(phone)).map((visit) => ({
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
    prescriptionItems: visit.prescriptionItems,
    advice: visit.advice,
    followUpDate: visit.followUpDate
  }));
}

export async function POST(request: Request) {
  if (!hasMobileToken(request)) return mobileUnauthorized();

  const parsed = mobilePatientLookupSchema.safeParse(await request.json().catch(() => ({})));
  const { phone, requestId } = parsed.success ? parsed.data : { phone: "", requestId: "" };

  if (phone.replace(/\D/g, "").length < 6) {
    return Response.json({ ok: false, version: "v1", error: "Enter a valid phone number." }, { status: 400 });
  }

  const patient = (await findPatientByPhone(phone));

  return mobileOk({
    patient: patient ? {
      id: patient.id,
      uhid: patient.uhid,
      name: patient.name,
      phone: patient.phone,
      alternatePhone: patient.alternatePhone,
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      status: patient.status,
      lastVisitAt: patient.lastVisitAt
    } : null,
    appointments: await publicAppointment(phone, requestId || undefined),
    visits: await publicVisit(phone)
  });
}
