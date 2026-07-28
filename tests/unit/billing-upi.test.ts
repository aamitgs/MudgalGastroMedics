import { afterEach, describe, expect, it } from "vitest";
import { buildUpiLink, invoiceUpiLink, isUpiConfigured, upiConfig } from "@/lib/billing-upi";

const ORIGINAL_VPA = process.env.HOSPITAL_UPI_VPA;
const ORIGINAL_NAME = process.env.HOSPITAL_UPI_NAME;

afterEach(() => {
  if (ORIGINAL_VPA === undefined) delete process.env.HOSPITAL_UPI_VPA;
  else process.env.HOSPITAL_UPI_VPA = ORIGINAL_VPA;
  if (ORIGINAL_NAME === undefined) delete process.env.HOSPITAL_UPI_NAME;
  else process.env.HOSPITAL_UPI_NAME = ORIGINAL_NAME;
});

function invoice(overrides: Partial<{ invoiceNo: string; balancePaise: number; patientName: string }> = {}) {
  return { invoiceNo: "MGM-INV-20260727-001", balancePaise: 4_50_000, patientName: "Asha Verma", ...overrides };
}

describe("upiConfig", () => {
  it("is absent until a VPA is configured", () => {
    delete process.env.HOSPITAL_UPI_VPA;
    expect(upiConfig()).toBeNull();
    expect(isUpiConfigured()).toBe(false);
  });

  it("falls back to the hospital name when no payee name is set", () => {
    process.env.HOSPITAL_UPI_VPA = "mudgal@upi";
    delete process.env.HOSPITAL_UPI_NAME;
    expect(upiConfig()).toEqual({ vpa: "mudgal@upi", payeeName: "Mudgal Gastromedics" });
  });

  it("treats a blank VPA as unconfigured", () => {
    process.env.HOSPITAL_UPI_VPA = "   ";
    expect(isUpiConfigured()).toBe(false);
  });
});

describe("buildUpiLink", () => {
  const config = { vpa: "mudgal@upi", payeeName: "Mudgal Gastromedics" };

  it("builds a upi://pay link with payee, amount and reference", () => {
    const link = buildUpiLink(config, { amountPaise: 4_50_000, reference: "MGMINV20260727001" });
    expect(link.startsWith("upi://pay?")).toBe(true);
    const params = new URLSearchParams(link.slice("upi://pay?".length));
    expect(params.get("pa")).toBe("mudgal@upi");
    expect(params.get("pn")).toBe("Mudgal Gastromedics");
    expect(params.get("cu")).toBe("INR");
    expect(params.get("tr")).toBe("MGMINV20260727001");
  });

  // Paise is this module's internal unit; UPI expects rupees with two decimals.
  it("renders the amount in rupees with two decimals", () => {
    const params = new URLSearchParams(buildUpiLink(config, { amountPaise: 4_50_000, reference: "R" }).slice("upi://pay?".length));
    expect(params.get("am")).toBe("4500.00");

    const withPaise = new URLSearchParams(buildUpiLink(config, { amountPaise: 150_050, reference: "R" }).slice("upi://pay?".length));
    expect(withPaise.get("am")).toBe("1500.50");
  });

  it("omits the note when there isn't one", () => {
    const params = new URLSearchParams(buildUpiLink(config, { amountPaise: 100, reference: "R" }).slice("upi://pay?".length));
    expect(params.get("tn")).toBeNull();
  });

  it("never emits a negative amount", () => {
    const params = new URLSearchParams(buildUpiLink(config, { amountPaise: -5000, reference: "R" }).slice("upi://pay?".length));
    expect(params.get("am")).toBe("0.00");
  });
});

describe("invoiceUpiLink", () => {
  it("is null when no VPA is configured — better no QR than one pointing at a made-up address", () => {
    delete process.env.HOSPITAL_UPI_VPA;
    expect(invoiceUpiLink(invoice())).toBeNull();
  });

  it("is null when nothing is owed", () => {
    process.env.HOSPITAL_UPI_VPA = "mudgal@upi";
    expect(invoiceUpiLink(invoice({ balancePaise: 0 }))).toBeNull();
    expect(invoiceUpiLink(invoice({ balancePaise: -100 }))).toBeNull();
  });

  it("asks for exactly the outstanding balance", () => {
    process.env.HOSPITAL_UPI_VPA = "mudgal@upi";
    const params = new URLSearchParams((invoiceUpiLink(invoice({ balancePaise: 1_25_000 })) ?? "").slice("upi://pay?".length));
    expect(params.get("am")).toBe("1250.00");
  });

  it("strips punctuation from the reference, which UPI apps handle poorly", () => {
    process.env.HOSPITAL_UPI_VPA = "mudgal@upi";
    const params = new URLSearchParams((invoiceUpiLink(invoice()) ?? "").slice("upi://pay?".length));
    expect(params.get("tr")).toBe("MGMINV20260727001");
  });

  it("names the invoice and patient in the transaction note", () => {
    process.env.HOSPITAL_UPI_VPA = "mudgal@upi";
    const params = new URLSearchParams((invoiceUpiLink(invoice()) ?? "").slice("upi://pay?".length));
    expect(params.get("tn")).toContain("MGM-INV-20260727-001");
  });
});
