import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listInventoryItems } from "@/lib/inventory-store";
import { listOpdVisits } from "@/lib/opd-store";
import { createPharmacyDispense, listPharmacyDispenses } from "@/lib/pharmacy-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    dispenses: (await listPharmacyDispenses()),
    visits: (await listOpdVisits()),
    inventory: (await listInventoryItems())
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const result = (await createPharmacyDispense(body));

  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    dispense: result.record,
    inventory: (await listInventoryItems())
  });
}
