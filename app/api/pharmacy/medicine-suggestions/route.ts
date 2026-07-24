import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listInventoryItems } from "@/lib/inventory-store";
import { medicineMatchScore } from "@/lib/pharmacy-search";

/**
 * Medicine-name predictive text for the doctor's Prescription table
 * (PrescriptionField.tsx) — deliberately its own narrow endpoint rather than
 * reusing GET /api/inventory (gated on "pharmacy-inventory":"view", which
 * main-doctor/duty-doctor don't have and shouldn't need just to see medicine
 * names). Gated on "prescriptions":"view" instead, and only ever returns the
 * fields relevant to picking a medicine to prescribe — never vendor, batch/lot
 * numbers, reorder levels or anything else pharmacy-inventory management
 * actually needs. Real stock, not a fabricated drug list, so a suggestion a
 * doctor picks is something the hospital can actually dispense. Matches on
 * brand name and generic name, typo-tolerant (lib/pharmacy-search.ts) so a
 * slightly misspelled query still finds the right medicine.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const items = await listInventoryItems();

  const medicines = items
    .filter((item) => item.category === "Medicine" && item.quantity > 0)
    .map((item) => {
      const nameScore = medicineMatchScore(query, item.name);
      const genericScore = item.genericName ? medicineMatchScore(query, item.genericName) : undefined;
      const score = [nameScore, genericScore].filter((value) => value !== undefined).sort((a, b) => a - b)[0];
      return { item, score };
    })
    .filter((entry): entry is { item: (typeof items)[number]; score: number } => entry.score !== undefined)
    .sort((left, right) => left.score - right.score)
    .slice(0, 8)
    .map(({ item }) => ({
      name: item.name,
      genericName: item.genericName,
      dosageForm: item.dosageForm,
      manufacturer: item.manufacturer,
      unit: item.unit,
      quantity: item.quantity
    }));

  return NextResponse.json({ ok: true, medicines });
}
