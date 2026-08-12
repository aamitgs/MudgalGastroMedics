// @vitest-environment node
// Server-only module, so this file opts out of the suite's default jsdom env.
import { describe, expect, it } from "vitest";
import { ItemisedInvoiceDocument } from "@/lib/pdf/itemised-invoice-document";
import type { Invoice } from "@/lib/billing-types";

const invoice: Invoice = {
  id: "INV-1",
  invoiceNo: "MGM-INV-20260811-015",
  createdAt: "2026-08-11T10:00:00.000Z",
  updatedAt: "2026-08-11T10:00:00.000Z",
  status: "Issued",
  uhid: "MGM-2026-00015",
  patientName: "Test Patient",
  phone: "9170695833",
  admissionId: "IPD-MSOXD53Q-JFJ",
  lineItems: [],
  payments: [],
  refunds: [],
  subtotalPaise: 350000,
  discountPaise: 0,
  taxPaise: 0,
  totalPaise: 350000,
  paidPaise: 0,
  refundedPaise: 0,
  balancePaise: 350000
};

/** Flattens the element tree to the visible strings, without a PDF renderer. */
function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return textOf(props?.children);
  }
  return "";
}

describe("itemised invoice", () => {
  it("prints the admission number for a bill raised against a stay", () => {
    const text = textOf(ItemisedInvoiceDocument({ invoice, admissionNo: "IPD-2026-00045" }));
    expect(text).toContain("Admission No.");
    expect(text).toContain("IPD-2026-00045");
  });

  // A daily OPD token labelled "Admission No." on a document the patient keeps
  // is the confusion admission numbers exist to end — the caller resolves a
  // real number or nothing, and the field disappears.
  it("omits the field when the stay has no number yet", () => {
    const text = textOf(ItemisedInvoiceDocument({ invoice, admissionNo: undefined }));
    expect(text).not.toContain("Admission No.");
    expect(text).toContain("MGM-2026-00015");
  });

  it("omits the field on an OPD bill", () => {
    const opd: Invoice = { ...invoice, admissionId: undefined };
    expect(textOf(ItemisedInvoiceDocument({ invoice: opd }))).not.toContain("Admission No.");
  });

  it("prints the visit number instead on an OPD bill", () => {
    const opd: Invoice = { ...invoice, admissionId: undefined, visitId: "OPD-1" };
    const text = textOf(ItemisedInvoiceDocument({ invoice: opd, visitNo: "OPD-2026-00123" }));
    expect(text).toContain("Visit No.");
    expect(text).toContain("OPD-2026-00123");
    expect(text).not.toContain("Admission No.");
  });

  // A bill belongs to one encounter. If both ever arrive, the stay wins rather
  // than the document showing two competing references.
  it("never prints both references at once", () => {
    const text = textOf(ItemisedInvoiceDocument({ invoice, admissionNo: "IPD-2026-00045", visitNo: "OPD-2026-00123" }));
    expect(text).toContain("IPD-2026-00045");
    expect(text).not.toContain("Visit No.");
  });
});
