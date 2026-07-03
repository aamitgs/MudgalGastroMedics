import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { getAppointmentById } from "@/lib/appointment-store";
import { createOpdVisit, listOpdVisits, updateOpdVisit } from "@/lib/opd-store";
import { opdVisitStatuses } from "@/lib/opd-types";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";

const billingStatuses: OpdVisit["billingStatus"][] = ["Not Started", "Estimate Shared", "Paid"];
const paymentMethods: NonNullable<OpdVisit["paymentMethod"]>[] = ["Cash", "UPI", "Card", "Insurance", "Other"];

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, visits: listOpdVisits() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "appointments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
  const appointment = getAppointmentById(appointmentId);

  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  const visit = createOpdVisit(appointment);
  return NextResponse.json({ ok: true, visit });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : undefined;
  const billingStatus = typeof body.billingStatus === "string" ? body.billingStatus : undefined;
  const estimatedAmount = typeof body.estimatedAmount === "string" ? body.estimatedAmount : undefined;
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : undefined;
  const notes = typeof body.notes === "string" ? body.notes : undefined;
  const clinicalNote = typeof body.clinicalNote === "string" ? body.clinicalNote : undefined;
  const prescription = typeof body.prescription === "string" ? body.prescription : undefined;
  const advice = typeof body.advice === "string" ? body.advice : undefined;
  const followUpDate = typeof body.followUpDate === "string" ? body.followUpDate : undefined;

  // Field-level enforcement: clinical fields need prescription rights, billing
  // fields need billing rights, and plain queue/status changes only need
  // appointment rights — so a nurse can move the queue but not write an Rx.
  const touchesClinical = [clinicalNote, prescription, advice, followUpDate].some((value) => value !== undefined);
  const touchesBilling = [billingStatus, estimatedAmount, paymentMethod].some((value) => value !== undefined);
  const auth = await authorize(
    request,
    touchesClinical ? "prescriptions" : touchesBilling ? "billing" : "appointments",
    "edit"
  );
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!id) {
    return NextResponse.json({ ok: false, error: "Visit id is required." }, { status: 400 });
  }

  if (status && !opdVisitStatuses.includes(status as OpdVisitStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid OPD status." }, { status: 400 });
  }

  if (billingStatus && !billingStatuses.includes(billingStatus as OpdVisit["billingStatus"])) {
    return NextResponse.json({ ok: false, error: "Invalid billing status." }, { status: 400 });
  }

  if (paymentMethod && !paymentMethods.includes(paymentMethod as NonNullable<OpdVisit["paymentMethod"]>)) {
    return NextResponse.json({ ok: false, error: "Invalid payment method." }, { status: 400 });
  }

  const visit = updateOpdVisit({
    id,
    status: status as OpdVisitStatus | undefined,
    billingStatus: billingStatus as OpdVisit["billingStatus"] | undefined,
    estimatedAmount,
    paymentMethod: paymentMethod as OpdVisit["paymentMethod"] | undefined,
    notes,
    clinicalNote,
    prescription,
    advice,
    followUpDate
  });

  if (!visit) {
    return NextResponse.json({ ok: false, error: "Visit not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, visit });
}
