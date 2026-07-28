import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rupeesToPaise } from "@/lib/billing-calc";
import { bundleSavingPaise, packageBalance } from "@/lib/package-calc";
import {
  createPackage,
  listPackages,
  listPatientPackages,
  packageListPrices,
  redeemFromPackage,
  refreshPackageStatuses,
  sellPackage,
  updatePackage
} from "@/lib/package-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { packageActionSchema, packageCreateSchema, packageUpdateSchema } from "@/lib/validation/packages";

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim();
  if (phone) {
    // Statuses are refreshed on read so a lapsed package never reads "Active"
    // just because no scheduled job ran.
    await refreshPackageStatuses();
    const purchases = await listPatientPackages(phone);
    return NextResponse.json({ ok: true, purchases, balances: purchases.map((purchase) => packageBalance(purchase)) });
  }

  const packages = await listPackages();
  const withSaving = await Promise.all(
    packages.map(async (pkg) => ({ ...pkg, savingPaise: bundleSavingPaise(pkg, await packageListPrices(pkg)) }))
  );
  return NextResponse.json({ ok: true, packages: withSaving });
}

/** Defining a package sets prices, so it checks the same resource price changes do. */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = packageCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const result = await createPackage({
    ...parsed.data,
    pricePaise: rupeesToPaise(parsed.data.price)
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.package.created",
    entityType: "service-package",
    entityId: result.package.id,
    after: result.package,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, package: result.package });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));

  // Selling and redeeming are counter work on the `billing` resource; changing
  // a package's definition is a pricing action and checks adjustments.
  const asAction = packageActionSchema.safeParse(body);
  if (asAction.success) {
    const auth = await authorize(request, "billing", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const actingStaffName = auth.context.userName || auth.context.activeRole;

    if (asAction.data.action === "sell") {
      const result = await sellPackage({ ...asAction.data, actingStaffName });
      if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

      await recordAuditEvent({
        actorRole: auth.context.activeRole,
        actorId: auth.context.userId,
        action: "billing.package.sold",
        entityType: "package-purchase",
        entityId: result.purchase.id,
        after: result.purchase,
        metadata: { invoiceNo: result.purchase.invoiceNo, packageCode: result.purchase.packageCode },
        device: auditRequestMetadata(request)
      });
      return NextResponse.json({ ok: true, purchase: result.purchase, balance: packageBalance(result.purchase) });
    }

    const result = await redeemFromPackage({ ...asAction.data, actingStaffName });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.package.redeemed",
      entityType: "package-purchase",
      entityId: result.purchase.id,
      metadata: {
        priceCode: asAction.data.priceCode,
        invoiceId: asAction.data.invoiceId,
        remaining: result.remaining
      },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, purchase: result.purchase, remaining: result.remaining, balance: packageBalance(result.purchase) });
  }

  const parsed = packageUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const auth = await authorize(request, "billing-adjustments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const result = await updatePackage({
    id: parsed.data.id,
    pricePaise: parsed.data.price === undefined ? undefined : rupeesToPaise(parsed.data.price),
    active: parsed.data.active,
    validityDays: parsed.data.validityDays,
    description: parsed.data.description
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 404 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.package.updated",
    entityType: "service-package",
    entityId: result.package.id,
    severity: "warning",
    after: result.package,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, package: result.package });
}
