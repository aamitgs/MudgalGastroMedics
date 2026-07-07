import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listInventoryItems } from "@/lib/inventory-store";
import { listOpdVisits } from "@/lib/opd-store";
import { queryPharmacyDispenses, type PharmacyPaymentFilter, type PharmacySortField, type SortDirection } from "@/lib/pharmacy-query";
import { createPharmacyDispense, listPharmacyDispenses } from "@/lib/pharmacy-store";

const sortFields: PharmacySortField[] = ["patientName", "token", "total", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allDispenses = await listPharmacyDispenses();
  const [visits, inventory] = await Promise.all([listOpdVisits(), listInventoryItems()]);

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, dispenses: allDispenses, visits, inventory });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const paymentStatus = params.get("paymentStatus");

  const result = queryPharmacyDispenses(allDispenses, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as PharmacySortField) ? (sortBy as PharmacySortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    paymentStatus: paymentStatus === "Paid" || paymentStatus === "Unpaid" ? (paymentStatus as PharmacyPaymentFilter) : undefined
  });

  const stats = {
    total: allDispenses.length,
    paidTotal: allDispenses.filter((record) => record.paymentStatus === "Paid").reduce((sum, record) => sum + record.total, 0),
    unpaid: allDispenses.filter((record) => record.paymentStatus === "Unpaid").length,
    lowStock: inventory.filter((item) => item.category === "Medicine" && item.quantity <= item.reorderLevel).length
  };

  return NextResponse.json({ ok: true, ...result, visits, inventory, stats });
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
