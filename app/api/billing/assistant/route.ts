import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { recommendations } from "@/lib/billing-assistant";
import { exportVouchers, voucherBalances, voucherCsvHeaders, voucherCsvRows } from "@/lib/billing-erp-export";
import { familyStatement, payFromFamilyWallet } from "@/lib/billing-family";
import { settleClaimAgainstInvoice, unsettledCover } from "@/lib/billing-insurance";
import { invoiceUpiLink, isUpiConfigured } from "@/lib/billing-upi";
import { getInvoiceById, listInvoices, listPatientInvoices } from "@/lib/billing-store";
import { listPatientInsuranceClaims } from "@/lib/finance-store";
import { listPatientPackages } from "@/lib/package-store";
import { getWallet } from "@/lib/wallet-store";
import { firstZodIssueMessage } from "@/lib/validation/http";

/**
 * The last of the enterprise enhancements (Track 5.11): the billing assistant,
 * insurance settlement, family billing, payment links and the accounting
 * export. Grouped behind one route because each is a thin operation over
 * entities other tracks already built.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const view = params.get("view") ?? "assistant";

  // --- accounting export -------------------------------------------------
  if (view === "erp") {
    const exportAuth = await authorize(request, "reports", "export");
    if (!exportAuth.ok) return NextResponse.json({ ok: false, error: exportAuth.error }, { status: exportAuth.status });

    const from = params.get("from")?.trim();
    const to = params.get("to")?.trim();
    const vouchers = exportVouchers(await listInvoices(), from && to ? { from, to } : undefined);
    const unbalanced = vouchers.filter((voucher) => !voucherBalances(voucher));

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.erp.exported",
      entityType: "billing-export",
      entityId: `${from ?? "all"}:${to ?? "all"}`,
      metadata: { voucherCount: vouchers.length, unbalanced: unbalanced.length },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({
      ok: true,
      vouchers,
      csv: { headers: voucherCsvHeaders, rows: voucherCsvRows(vouchers) },
      // Surfaced rather than swallowed: an unbalanced voucher is a bug an
      // accountant would otherwise find weeks later.
      unbalanced: unbalanced.map((voucher) => voucher.reference)
    });
  }

  const phone = params.get("phone")?.trim();
  if (!phone) return NextResponse.json({ ok: false, error: "A patient phone number is required." }, { status: 400 });

  // --- family statement --------------------------------------------------
  if (view === "family") {
    const statement = await familyStatement(phone, params.get("name")?.trim() || "Account holder");
    return NextResponse.json({ ok: true, statement });
  }

  // --- payment link ------------------------------------------------------
  if (view === "payment-link") {
    const invoiceId = params.get("invoiceId")?.trim();
    if (!invoiceId) return NextResponse.json({ ok: false, error: "An invoice id is required." }, { status: 400 });
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });

    const upi = invoiceUpiLink(invoice);
    return NextResponse.json({
      ok: true,
      // A UPI deep link is a working, fee-free payment link. A hosted,
      // status-tracked link needs a gateway account this project does not
      // have — said plainly rather than stubbed.
      upiLink: upi,
      trackable: false,
      note: isUpiConfigured()
        ? "UPI deep link — the patient pays directly. Confirmation still has to be recorded at the counter; automatic status tracking needs a payment gateway."
        : "Set HOSPITAL_UPI_VPA to generate payment links."
    });
  }

  // --- assistant ---------------------------------------------------------
  const invoiceId = params.get("invoiceId")?.trim();
  const [invoices, wallet, packages, claims] = await Promise.all([
    listPatientInvoices(phone),
    getWallet(phone),
    listPatientPackages(phone),
    listPatientInsuranceClaims(phone)
  ]);

  const invoice = invoiceId ? (invoices.find((entry) => entry.id === invoiceId) ?? null) : null;

  return NextResponse.json({
    ok: true,
    recommendations: recommendations({ invoice, invoices, wallet, packages, insuranceClaims: claims }),
    unsettledCover: unsettledCover(claims).map((entry) => ({
      claimId: entry.claim.id,
      insurer: entry.claim.insurer,
      tpa: entry.claim.tpa,
      remainingPaise: entry.remainingPaise
    }))
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("settle-insurance"),
    claimId: z.string().trim().min(1, "Claim id is required."),
    invoiceId: z.string().trim().min(1, "Invoice id is required."),
    amount: z.coerce.number().positive("Enter a settlement amount greater than zero."),
    reference: z.string().trim().optional()
  }),
  z.object({
    action: z.literal("family-pay"),
    ownerPhone: z.string().trim().min(6, "A family account phone is required."),
    ownerName: z.string().trim().min(1, "The account holder's name is required."),
    fromPhone: z.string().trim().min(6, "Whose wallet is paying?"),
    invoiceId: z.string().trim().min(1, "Invoice id is required."),
    amount: z.coerce.number().positive().optional()
  })
]);

export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = actionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;
  const actingStaffName = auth.context.userName || auth.context.activeRole;

  if (body.action === "settle-insurance") {
    const result = await settleClaimAgainstInvoice({
      claimId: body.claimId,
      invoiceId: body.invoiceId,
      amountPaise: Math.round(body.amount * 100),
      reference: body.reference,
      actingStaffName
    });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.insurance.settled",
      entityType: "insurance-claim",
      entityId: body.claimId,
      metadata: { invoiceNo: result.invoiceNo, settledPaise: result.settledPaise, status: result.claim.status },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, claim: result.claim, settledPaise: result.settledPaise, invoiceNo: result.invoiceNo });
  }

  const result = await payFromFamilyWallet({
    ownerPhone: body.ownerPhone,
    ownerName: body.ownerName,
    fromPhone: body.fromPhone,
    invoiceId: body.invoiceId,
    amountPaise: body.amount === undefined ? undefined : Math.round(body.amount * 100),
    actingStaffName
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.family.paid",
    entityType: "invoice",
    entityId: body.invoiceId,
    metadata: { paidBy: result.paidBy, paidFor: result.paidFor, appliedPaise: result.appliedPaise },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, appliedPaise: result.appliedPaise, paidBy: result.paidBy, paidFor: result.paidFor });
}
