import { NextResponse } from "next/server";
import { listPatientAppointments } from "@/lib/appointment-store";

export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone")?.trim() ?? "";
  if (phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ ok: true, match: null });
  }

  const [appointment] = await listPatientAppointments(phone);
  if (!appointment) return NextResponse.json({ ok: true, match: null });

  return NextResponse.json({
    ok: true,
    match: {
      id: appointment.id,
      name: appointment.name,
      phone: appointment.phone,
      email: appointment.email,
      age: appointment.age,
      gender: appointment.gender,
      addressLine: appointment.addressLine,
      city: appointment.city,
      state: appointment.state,
      postalCode: appointment.postalCode,
      patientType: appointment.patientType,
      contactMethod: appointment.contactMethod,
      service: appointment.service
    }
  });
}
