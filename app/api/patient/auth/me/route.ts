import { NextResponse } from "next/server";
import { getPatientIdentityById } from "@/lib/patient-access/identity-store";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";

export async function GET(request: Request) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }
  const identity = await getPatientIdentityById(session.identityId);
  return NextResponse.json({
    ok: true,
    authenticated: true,
    phone: session.phone,
    hasEmail: Boolean(identity?.email),
    email: identity?.email
  });
}
