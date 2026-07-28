/**
 * UPI payment links and the QR payloads printed on an invoice (Track 5.8, §13).
 *
 * A UPI QR is just a `upi://pay` deep link encoded as a QR — no gateway, no
 * dependency, no per-transaction fee. The patient scans it in any UPI app and
 * the amount, payee and reference are pre-filled, which removes the two things
 * that go wrong at a counter: typing the wrong amount, and paying the wrong VPA.
 *
 * The hospital's VPA comes from `HOSPITAL_UPI_VPA`. When it is not configured
 * the QR is **omitted entirely** rather than rendered against a placeholder —
 * a QR that sends a patient's money to a made-up address is far worse than no
 * QR at all.
 */

export type UpiPayeeConfig = {
  vpa: string;
  payeeName: string;
};

export function upiConfig(): UpiPayeeConfig | null {
  const vpa = process.env.HOSPITAL_UPI_VPA?.trim();
  if (!vpa) return null;
  return { vpa, payeeName: process.env.HOSPITAL_UPI_NAME?.trim() || "Mudgal Gastromedics" };
}

export function isUpiConfigured() {
  return upiConfig() !== null;
}

/**
 * Builds the `upi://pay` deep link. Amount is rendered in rupees with two
 * decimals, which is what the UPI spec expects — paise are this module's
 * internal unit, not the wire format.
 */
export function buildUpiLink(config: UpiPayeeConfig, options: { amountPaise: number; reference: string; note?: string }): string {
  const params = new URLSearchParams({
    pa: config.vpa,
    pn: config.payeeName,
    am: (Math.max(0, Math.round(options.amountPaise)) / 100).toFixed(2),
    cu: "INR",
    tr: options.reference
  });
  if (options.note) params.set("tn", options.note);
  // UPI apps are strict about `&` separators but tolerant of encoding;
  // URLSearchParams gives the canonical form.
  return `upi://pay?${params.toString()}`;
}

/** The link for one invoice's outstanding balance, or null when UPI isn't configured or nothing is owed. */
export function invoiceUpiLink(invoice: { invoiceNo: string; balancePaise: number; patientName: string }): string | null {
  const config = upiConfig();
  if (!config) return null;
  if (invoice.balancePaise <= 0) return null;
  return buildUpiLink(config, {
    amountPaise: invoice.balancePaise,
    reference: invoice.invoiceNo.replace(/[^A-Za-z0-9]/g, ""),
    note: `${invoice.invoiceNo} ${invoice.patientName}`.slice(0, 50)
  });
}
