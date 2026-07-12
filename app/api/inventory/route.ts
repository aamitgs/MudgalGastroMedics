import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { queryInventoryItems, type InventorySortField, type SortDirection } from "@/lib/inventory-query";
import { adjustInventoryQuantity, listInventoryItems, upsertInventoryItem } from "@/lib/inventory-store";
import { inventoryCategories, inventoryExpiryStatus } from "@/lib/inventory-types";
import type { InventoryCategory } from "@/lib/inventory-types";
import { inventoryAdjustSchema, inventoryCreateSchema } from "@/lib/validation/operations";

const sortFields: InventorySortField[] = ["name", "category", "quantity", "expiryDate", "lastUpdatedAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allItems = await listInventoryItems();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, items: allItems });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const category = params.get("category");

  const result = queryInventoryItems(allItems, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as InventorySortField) ? (sortBy as InventorySortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    category: category && inventoryCategories.includes(category as InventoryCategory) ? (category as InventoryCategory) : undefined,
    lowStockOnly: params.get("lowStockOnly") === "true",
    expiryOnly: params.get("expiryOnly") === "true"
  });

  const stats = {
    total: allItems.length,
    lowStock: allItems.filter((item) => item.quantity <= item.reorderLevel).length,
    expiryAlerts: allItems.filter((item) => inventoryExpiryStatus(item) !== null).length,
    medicines: allItems.filter((item) => item.category === "Medicine").length,
    procedureKits: allItems.filter((item) => item.category === "Procedure Kit").length
  };

  return NextResponse.json({ ok: true, ...result, stats });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = inventoryCreateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};
  const category = typeof body.category === "string" ? body.category : "";

  if (!String(body.name || "").trim()) {
    return NextResponse.json({ ok: false, error: "Item name is required." }, { status: 400 });
  }

  if (category && !inventoryCategories.includes(category as InventoryCategory)) {
    return NextResponse.json({ ok: false, error: "Invalid inventory category." }, { status: 400 });
  }

  const item = (await upsertInventoryItem(body));
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = inventoryAdjustSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { id: "", delta: undefined };
  const id = body.id;
  const delta = Number(body.delta);

  if (!id || !Number.isFinite(delta)) {
    return NextResponse.json({ ok: false, error: "Valid item id and delta are required." }, { status: 400 });
  }

  const item = (await adjustInventoryQuantity(id, delta));
  if (!item) {
    return NextResponse.json({ ok: false, error: "Inventory item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}
