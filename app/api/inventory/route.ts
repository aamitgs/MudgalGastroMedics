import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { adjustInventoryQuantity, listInventoryItems, upsertInventoryItem } from "@/lib/inventory-store";
import { inventoryCategories } from "@/lib/inventory-types";
import type { InventoryCategory } from "@/lib/inventory-types";

export async function GET(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, items: listInventoryItems() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const category = typeof body.category === "string" ? body.category : "";

  if (!String(body.name || "").trim()) {
    return NextResponse.json({ ok: false, error: "Item name is required." }, { status: 400 });
  }

  if (category && !inventoryCategories.includes(category as InventoryCategory)) {
    return NextResponse.json({ ok: false, error: "Invalid inventory category." }, { status: 400 });
  }

  const item = upsertInventoryItem(body);
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const delta = Number(body.delta);

  if (!id || !Number.isFinite(delta)) {
    return NextResponse.json({ ok: false, error: "Valid item id and delta are required." }, { status: 400 });
  }

  const item = adjustInventoryQuantity(id, delta);
  if (!item) {
    return NextResponse.json({ ok: false, error: "Inventory item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}
