import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { accountEntryTypes, insuranceClaimStatuses } from "@/lib/finance-types";
import type { AccountEntryType, InsuranceClaimStatus } from "@/lib/finance-types";
import { createAccountEntry, createInsuranceClaim, listAccountEntries, listInsuranceClaims, updateInsuranceClaim } from "@/lib/finance-store";
import { listIpdAdmissions } from "@/lib/ipd-store";
import { listOpdVisits } from "@/lib/opd-store";
import { financeClaimUpdateSchema, financeCreateSchema } from "@/lib/validation/operations";

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

  const parsed = financeCreateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { mode: "entry", type: undefined };
  const { mode } = body;

  if (mode === "claim") {
    const result = (await createInsuranceClaim(body));
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, claim: result.claim });
  }

  const type = body.type && accountEntryTypes.includes(body.type as AccountEntryType) ? body.type : "Expense";
  const result = (await createAccountEntry({ ...body, type }));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, entry: result.entry });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = financeClaimUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { id: "" };
  const { id } = body;
  const status = body.status && insuranceClaimStatuses.includes(body.status as InsuranceClaimStatus) ? (body.status as InsuranceClaimStatus) : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "Claim id is required." }, { status: 400 });

  const claim = (await updateInsuranceClaim({
    id,
    status,
    requestedAmount: body.requestedAmount === undefined ? undefined : Number(body.requestedAmount),
    approvedAmount: body.approvedAmount === undefined ? undefined : Number(body.approvedAmount),
    settledAmount: body.settledAmount === undefined ? undefined : Number(body.settledAmount),
    claimNumber: body.claimNumber,
    documents: body.documents,
    notes: body.notes
  }));

  if (!claim) return NextResponse.json({ ok: false, error: "Claim not found." }, { status: 404 });
  return NextResponse.json({ ok: true, claim });
}
