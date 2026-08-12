// @vitest-environment node
/**
 * Guards the *wiring* of the child registers, which the nextSerialNumber unit
 * tests cannot reach. Two failure modes here typecheck cleanly and pass every
 * other test in the suite:
 *
 *   - a copy-pasted prefix, so one module silently issues another's numbers
 *     (`nextSerialNumber("LAB", …)` inside pharmacy-store compiles fine);
 *   - a dropped `visitNo: visit.visitNo`, which compiles because the field is
 *     optional and just quietly loses which consultation the record came from.
 *
 * The document store is replaced with an in-memory map so the real create
 * functions run end to end without touching .data/ or a database.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const docs = new Map<string, unknown>();

vi.mock("@/lib/document-store", () => ({
  createDocumentStore: (key: string, normalize: (parsed: unknown) => unknown) => ({
    load: async () => normalize(docs.get(key)),
    save: async (doc: unknown) => void docs.set(key, doc)
  })
}));

const visit = {
  id: "OPD-1",
  visitNo: "OPD-2026-00123",
  token: "MGM-014",
  patientId: "PAT-1",
  uhid: "MGM-2026-00015",
  patientName: "Asha Verma",
  phone: "9876543210",
  service: "Gastro consult"
};

vi.mock("@/lib/opd-store", () => ({ getOpdVisitById: async () => visit }));
vi.mock("@/lib/cms-public", () => ({
  getPublicProcedures: async () => [{ slug: "upper-gi-endoscopy", title: "Upper GI Endoscopy" }]
}));
vi.mock("@/lib/inventory-store", () => ({
  listInventoryItems: async () => [{ id: "INV-1", name: "Pantoprazole", unit: "tab", quantity: 50 }],
  adjustInventoryQuantity: async () => undefined
}));

beforeEach(() => docs.clear());

describe("child register numbering", () => {
  it("lab orders get their own LAB series, and two from one visit stay distinct", async () => {
    const { createLabOrder } = await import("@/lib/lab-store");
    const first = await createLabOrder({ visitId: visit.id, tests: ["CBC"] });
    const second = await createLabOrder({ visitId: visit.id, tests: ["LFT"] });

    expect(first).toMatchObject({ order: { orderNo: "LAB-2026-00001", visitNo: "OPD-2026-00123" } });
    // The whole reason a lab order needs its own number rather than reusing
    // the encounter's: one visit can raise several.
    expect(second).toMatchObject({ order: { orderNo: "LAB-2026-00002", visitNo: "OPD-2026-00123" } });
  });

  it("pharmacy dispenses get their own PHA series and carry the visit link", async () => {
    const { createPharmacyDispense } = await import("@/lib/pharmacy-store");
    const result = await createPharmacyDispense({
      visitId: visit.id,
      items: [{ inventoryItemId: "INV-1", quantity: "1", unitPrice: "50" }]
    });

    // The store returns { record }; the API route is what renames it to `dispense`.
    expect(result).toMatchObject({ record: { dispenseNo: "PHA-2026-00001", visitNo: "OPD-2026-00123" } });
  });

  it("procedures get their own PRC series and carry the visit link", async () => {
    const { createProcedureSchedule } = await import("@/lib/procedure-store");
    const result = await createProcedureSchedule({
      visitId: visit.id,
      procedureSlug: "upper-gi-endoscopy",
      scheduledDate: "2026-08-20",
      scheduledTime: "10:00"
    });

    expect(result).toMatchObject({ schedule: { scheduleNo: "PRC-2026-00001", visitNo: "OPD-2026-00123" } });
  });

  it("external referrals get their own REF series and carry the visit link", async () => {
    const { createExternalReferral } = await import("@/lib/external-referral-store");
    const result = await createExternalReferral({ visitId: visit.id, type: "Radiology", testName: "USG Abdomen" });

    expect(result).toMatchObject({ referral: { referralNo: "REF-2026-00001", visitNo: "OPD-2026-00123" } });
  });

  // A visit still awaiting the backfill has no number to hand down. The record
  // must still be created — losing the order because the link is missing would
  // be far worse than the missing link itself.
  it("still issues a number when the originating visit has none yet", async () => {
    vi.resetModules();
    vi.doMock("@/lib/opd-store", () => ({ getOpdVisitById: async () => ({ ...visit, visitNo: undefined }) }));
    const { createLabOrder } = await import("@/lib/lab-store");
    const result = await createLabOrder({ visitId: visit.id, tests: ["CBC"] });

    expect(result).toMatchObject({ order: { orderNo: "LAB-2026-00001", visitNo: undefined } });
  });
});
