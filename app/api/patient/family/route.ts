import { NextResponse } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { addFamilyMember, listFamilyMembers, removeFamilyMember } from "@/lib/family-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { familyMemberCreateSchema, familyMemberDeleteSchema } from "@/lib/validation/patient-auth";

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

  const parsed = familyMemberCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const result = (await addFamilyMember({ ...parsed.data, ownerPhone: session.phone }));
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

  const parsed = familyMemberDeleteSchema.safeParse(await request.json().catch(() => ({})));
  const id = parsed.success ? parsed.data.id : "";

  const removed = (await removeFamilyMember(id, session.phone));
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Family member not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
