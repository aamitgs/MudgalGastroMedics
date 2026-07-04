import { NextResponse } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { addFamilyMember, listFamilyMembers, removeFamilyMember } from "@/lib/family-store";

export async function POST(request: Request) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number first." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, members: (await listFamilyMembers(session.phone)) });
}

export async function PUT(request: Request) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = (await addFamilyMember({ ...body, ownerPhone: session.phone }));
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, member: result.member });
}

export async function DELETE(request: Request) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";

  const removed = (await removeFamilyMember(id, session.phone));
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Family member not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
