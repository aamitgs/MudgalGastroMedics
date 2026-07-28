import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rupeesToPaise } from "@/lib/billing-calc";
import { summariseWallet } from "@/lib/wallet-calc";
import { applyAdvanceToInvoice, depositToWallet, getWallet, refundWalletBalance } from "@/lib/wallet-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { walletDepositSchema, walletUpdateSchema } from "@/lib/validation/wallet";

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ ok: false, error: "A patient phone number is required." }, { status: 400 });

  const wallet = await getWallet(phone);
  // A patient with no wallet is a normal state, not an error — the desk still
  // needs a zero balance to decide whether to ask for a deposit.
  if (!wallet) {
    return NextResponse.json({ ok: true, wallet: null, summary: summariseWallet([]) });
  }

  return NextResponse.json({ ok: true, wallet, summary: summariseWallet(wallet.transactions) });
}

/** Taking a deposit is front-desk work, so it rides on the same `billing` create that raising a bill does. */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = walletDepositSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const result = await depositToWallet({
    ...parsed.data,
    amountPaise: rupeesToPaise(parsed.data.amount),
    actingStaffName: auth.context.userName || auth.context.activeRole
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.wallet.deposited",
    entityType: "patient-wallet",
    entityId: result.wallet.id,
    metadata: {
      amountPaise: result.transaction.amountPaise,
      method: result.transaction.method,
      balanceAfterPaise: result.transaction.balanceAfterPaise
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, wallet: result.wallet, transaction: result.transaction });
}

export async function PATCH(request: Request) {
  const parsed = walletUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  // Applying an advance moves money the hospital already holds toward a bill
  // the patient already owes — ordinary collection work. Refunding sends money
  // back out, so it checks the separate billing-adjustments resource that
  // reception is deliberately not granted.
  const auth =
    body.action === "refund" ? await authorize(request, "billing-adjustments", "edit") : await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const actingStaffName = auth.context.userName || auth.context.activeRole;

  if (body.action === "apply-advance") {
    const result = await applyAdvanceToInvoice({
      invoiceId: body.invoiceId,
      amountPaise: body.amount === undefined ? undefined : rupeesToPaise(body.amount),
      actingStaffName
    });
    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Invoice not found." ? 404 : 400 });
    }

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.wallet.applied",
      entityType: "patient-wallet",
      entityId: result.wallet.id,
      metadata: {
        invoiceId: body.invoiceId,
        invoiceNo: result.transaction.invoiceNo,
        appliedPaise: result.appliedPaise,
        balanceAfterPaise: result.transaction.balanceAfterPaise
      },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, wallet: result.wallet, appliedPaise: result.appliedPaise });
  }

  const result = await refundWalletBalance({
    phone: body.phone,
    amountPaise: rupeesToPaise(body.amount),
    method: body.method,
    reason: body.reason,
    reference: body.reference,
    actingStaffName
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.wallet.refunded",
    entityType: "patient-wallet",
    entityId: result.wallet.id,
    severity: "warning",
    metadata: {
      amountPaise: result.transaction.amountPaise,
      method: result.transaction.method,
      reason: result.transaction.reason,
      balanceAfterPaise: result.transaction.balanceAfterPaise
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, wallet: result.wallet, transaction: result.transaction });
}
