import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { getAppointmentById } from "@/lib/appointment-store";
import { queryOpdVisits, type OpdSortField, type SortDirection } from "@/lib/opd-query";
import { createOpdVisit, listOpdVisits, updateOpdVisit } from "@/lib/opd-store";
import { opdVisitStatuses } from "@/lib/opd-types";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";

const billingStatuses: OpdVisit["billingStatus"][] = ["Not Started", "Estimate Shared", "Paid"];
const paymentMethods: NonNullable<OpdVisit["paymentMethod"]>[] = ["Cash", "UPI", "Card", "Insurance", "Other"];
const sortFields: OpdSortField[] = ["patientName", "token", "status", "service", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allVisits = await listOpdVisits();

  // Backward compatible: existing callers (Billing, Doctor Portal,
  // Appointments) that pass no pagination params keep getting the full flat
  // list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, visits: allVisits });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const excludeStatus = params.get("excludeStatus");

  const result = queryOpdVisits(allVisits, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as OpdSortField) ? (sortBy as OpdSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && opdVisitStatuses.includes(status as OpdVisitStatus) ? (status as OpdVisitStatus) : undefined,
    excludeStatus: excludeStatus && opdVisitStatuses.includes(excludeStatus as OpdVisitStatus) ? (excludeStatus as OpdVisitStatus) : undefined
  });

  const stats = {
    waiting: allVisits.filter((visit) => visit.status === "Waiting").length,
    inConsultation: allVisits.filter((visit) => visit.status === "In Consultation").length,
    completed: allVisits.filter((visit) => visit.status === "Completed").length,
    paid: allVisits.filter((visit) => visit.billingStatus === "Paid").length
  };

  return NextResponse.json({ ok: true, ...result, stats });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "appointments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
  const appointment = (await getAppointmentById(appointmentId));

  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  const visit = (await createOpdVisit(appointment));
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

  const visit = (await updateOpdVisit({
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
  }));

  if (!visit) {
    return NextResponse.json({ ok: false, error: "Visit not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, visit });
}
