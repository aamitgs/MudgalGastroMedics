import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listInventoryItems } from "@/lib/inventory-store";

/**
 * Medicine-name predictive text for the doctor's Prescription table
 * (PrescriptionField.tsx) — deliberately its own narrow endpoint rather than
 * reusing GET /api/inventory (gated on "pharmacy-inventory":"view", which
 * main-doctor/duty-doctor don't have and shouldn't need just to see medicine
 * names). Gated on "prescriptions":"view" instead, and only ever returns
 * name/unit/quantity for category="Medicine" items — never vendor, batch/lot
 * numbers, reorder levels or anything else pharmacy-inventory management
 * actually needs. Real stock, not a fabricated drug list, so a suggestion a
 * doctor picks is something the hospital can actually dispense.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const items = await listInventoryItems();

  const medicines = items
    .filter((item) => item.category === "Medicine" && item.quantity > 0)
    .filter((item) => !query || item.name.toLowerCase().includes(query))
    .slice(0, 8)
    .map((item) => ({ name: item.name, unit: item.unit, quantity: item.quantity }));

  return NextResponse.json({ ok: true, medicines });
}
