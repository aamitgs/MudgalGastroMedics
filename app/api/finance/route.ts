import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { accountEntryTypes, insuranceClaimStatuses } from "@/lib/finance-types";
import type { AccountEntryType, InsuranceClaimStatus } from "@/lib/finance-types";
import { createAccountEntry, createInsuranceClaim, listAccountEntries, listInsuranceClaims, updateInsuranceClaim } from "@/lib/finance-store";
import { listIpdAdmissions } from "@/lib/ipd-store";
import { listOpdVisits } from "@/lib/opd-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    claims: (await listInsuranceClaims()),
    entries: (await listAccountEntries()),
    admissions: (await listIpdAdmissions()),
    visits: (await listOpdVisits())
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "entry";

  if (mode === "claim") {
    const result = (await createInsuranceClaim(body));
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, claim: result.claim });
  }

  const type = typeof body.type === "string" && accountEntryTypes.includes(body.type as AccountEntryType) ? body.type : "Expense";
  const result = (await createAccountEntry({ ...body, type }));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, entry: result.entry });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" && insuranceClaimStatuses.includes(body.status as InsuranceClaimStatus) ? body.status as InsuranceClaimStatus : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "Claim id is required." }, { status: 400 });

  const claim = (await updateInsuranceClaim({
    id,
    status,
    requestedAmount: body.requestedAmount === undefined ? undefined : Number(body.requestedAmount),
    approvedAmount: body.approvedAmount === undefined ? undefined : Number(body.approvedAmount),
    settledAmount: body.settledAmount === undefined ? undefined : Number(body.settledAmount),
    claimNumber: typeof body.claimNumber === "string" ? body.claimNumber : undefined,
    documents: typeof body.documents === "string" ? body.documents : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined
  }));

  if (!claim) return NextResponse.json({ ok: false, error: "Claim not found." }, { status: 404 });
  return NextResponse.json({ ok: true, claim });
}
