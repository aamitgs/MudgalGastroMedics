import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * End-to-end cover for the billing module (Track 5).
 *
 * Deliberately weighted toward the invariants where a regression costs real
 * money — double-charging, over-collecting, self-approved write-offs, an
 * advance drawn from the wrong wallet — rather than toward rendering. Those
 * are asserted against the live API because that is where the rules live and
 * where a UI change cannot quietly bypass them; one UI journey covers the
 * collection screen itself.
 *
 * Every test seeds its own patient with a run-unique identifier: the billing
 * stores are not cleared between runs (unlike the OPD stores in global-setup),
 * so shared fixtures would make results depend on run order.
 */

const RUN = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

async function signIn(request: APIRequestContext) {
  const response = await request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
  expect(response.ok()).toBe(true);
}

async function json<T = Record<string, unknown>>(response: { json: () => Promise<unknown> }): Promise<T> {
  return (await response.json()) as T;
}

type Invoice = {
  id: string;
  invoiceNo: string;
  status: string;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  lineItems: Array<{ id: string; source: string; description: string; unitPricePaise: number; sourceRef?: string }>;
  payments: Array<{ method: string; amountPaise: number }>;
  refunds?: Array<{ amountPaise: number; reason: string }>;
  visitId?: string;
};

/** A patient with one OPD visit, unique to this test. */
async function seedVisit(request: APIRequestContext, tag: string) {
  const suffix = RUN();
  const response = await request.post("/api/opd", {
    data: {
      patientName: `E2E ${tag} ${suffix}`,
      phone: `9${String(Date.now()).slice(-9)}`,
      service: "Gastro consultation",
      symptoms: ["Acidity"],
      priority: "Routine"
    }
  });
  const body = await json<{ ok: boolean; visit: { id: string; phone: string; patientName: string; token: string } }>(response);
  expect(body.ok, JSON.stringify(body)).toBe(true);
  return { ...body.visit, suffix };
}

async function seedInvoice(
  request: APIRequestContext,
  visitId: string,
  lineItems: Array<{ source: string; description: string; category: string; quantity: number; unitPrice: number; sourceRef?: string }>,
  { issue = true } = {}
) {
  const created = await json<{ ok: boolean; invoice: Invoice }>(await request.post("/api/billing", { data: { visitId, lineItems } }));
  expect(created.ok, JSON.stringify(created)).toBe(true);
  if (issue) await request.patch("/api/billing", { data: { action: "issue", id: created.invoice.id } });
  return created.invoice;
}

async function readInvoice(request: APIRequestContext, id: string) {
  const body = await json<{ ok: boolean; invoice: Invoice }>(await request.get(`/api/billing?id=${id}`));
  expect(body.ok).toBe(true);
  return body.invoice;
}

test.beforeEach(async ({ request }) => {
  await signIn(request);
});

test.describe("invoice collection", () => {
  test("split tenders settle a bill and the balance falls to zero", async ({ request }) => {
    const visit = await seedVisit(request, "split");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "Procedure", description: "Upper GI Endoscopy", category: "Procedure", quantity: 1, unitPrice: 5000 }
    ]);

    for (const [method, amount] of [
      ["Cash", 2000],
      ["UPI", 2000],
      ["Card", 1000]
    ] as const) {
      const response = await request.patch("/api/billing", { data: { action: "record-payment", id: invoice.id, method, amount } });
      expect(response.ok(), `${method} payment`).toBe(true);
    }

    const settled = await readInvoice(request, invoice.id);
    expect(settled.payments).toHaveLength(3);
    expect(settled.balancePaise).toBe(0);
    expect(settled.status).toBe("Paid");
  });

  test("a payment larger than the outstanding balance is refused", async ({ request }) => {
    const visit = await seedVisit(request, "over");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }
    ]);

    const response = await request.patch("/api/billing", { data: { action: "record-payment", id: invoice.id, method: "Cash", amount: 5000 } });
    expect(response.status()).toBe(400);
    expect((await json<{ error: string }>(response)).error).toMatch(/more than the/i);

    // The bill must be untouched by a refused payment.
    expect((await readInvoice(request, invoice.id)).paidPaise).toBe(0);
  });

  test("payment cannot be taken against an unissued draft", async ({ request }) => {
    const visit = await seedVisit(request, "draft");
    const invoice = await seedInvoice(
      request,
      visit.id,
      [{ source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }],
      { issue: false }
    );

    const response = await request.patch("/api/billing", { data: { action: "record-payment", id: invoice.id, method: "Cash", amount: 100 } });
    expect(response.status()).toBe(400);
    expect((await json<{ error: string }>(response)).error).toMatch(/issue this invoice/i);
  });

  test("a visit cannot carry two live invoices", async ({ request }) => {
    const visit = await seedVisit(request, "dupe");
    await seedInvoice(request, visit.id, [{ source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }]);

    const second = await request.post("/api/billing", { data: { visitId: visit.id } });
    expect(second.status()).toBe(400);
    expect((await json<{ error: string }>(second)).error).toMatch(/already has invoice/i);
  });
});

test.describe("automatic charge generation", () => {
  test("re-syncing an encounter never bills the same charge twice", async ({ request }) => {
    const visit = await seedVisit(request, "sync");
    await request.post("/api/lab", {
      data: { visitId: visit.id, priority: "Routine", paymentStatus: "Unpaid", amount: 800, tests: ["LFT"] }
    });

    const invoice = await seedInvoice(request, visit.id, [], { issue: false });

    const first = await json<{ ok: boolean; added: number; invoice: Invoice }>(
      await request.patch("/api/billing", { data: { action: "sync-charges", id: invoice.id } })
    );
    expect(first.ok).toBe(true);
    expect(first.added).toBeGreaterThan(0);
    const totalAfterFirst = first.invoice.totalPaise;

    const second = await json<{ added: number; invoice: Invoice }>(
      await request.patch("/api/billing", { data: { action: "sync-charges", id: invoice.id } })
    );
    expect(second.added, "a second sync must add nothing").toBe(0);
    expect(second.invoice.totalPaise).toBe(totalAfterFirst);
  });

  test("a lab order already collected at the counter is never re-billed", async ({ request }) => {
    const visit = await seedVisit(request, "paidlab");
    await request.post("/api/lab", {
      data: { visitId: visit.id, priority: "Routine", paymentStatus: "Paid", amount: 1200, tests: ["CBC"] }
    });

    const invoice = await seedInvoice(request, visit.id, [], { issue: false });
    const synced = await json<{ invoice: Invoice; skipped: Array<{ reason: string }> }>(
      await request.patch("/api/billing", { data: { action: "sync-charges", id: invoice.id } })
    );

    expect(synced.invoice.lineItems.some((line) => line.source === "Laboratory")).toBe(false);
    // And it must say so rather than dropping it silently.
    expect(synced.skipped.some((entry) => /already collected/i.test(entry.reason))).toBe(true);
  });
});

test.describe("advance wallet", () => {
  test("an advance settles a bill and is capped at what is owed", async ({ request }) => {
    const visit = await seedVisit(request, "wallet");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }
    ]);

    await request.post("/api/billing/wallet", {
      data: { phone: visit.phone, patientName: visit.patientName, amount: 2000, method: "Cash" }
    });

    // No amount given means "as much as helps" — it must settle the bill, not
    // empty the wallet.
    const applied = await json<{ ok: boolean; appliedPaise: number; wallet: { balancePaise: number } }>(
      await request.patch("/api/billing/wallet", { data: { action: "apply-advance", invoiceId: invoice.id } })
    );
    expect(applied.ok).toBe(true);
    expect(applied.appliedPaise).toBe(50_000);
    expect(applied.wallet.balancePaise, "the remainder stays in the wallet").toBe(150_000);

    const settled = await readInvoice(request, invoice.id);
    expect(settled.status).toBe("Paid");
    expect(settled.payments.some((payment) => payment.method === "Wallet")).toBe(true);
  });
});

test.describe("adjustment approvals", () => {
  test("a discount does not touch the bill until it is approved", async ({ request }) => {
    const visit = await seedVisit(request, "discount");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "Procedure", description: "Upper GI Endoscopy", category: "Procedure", quantity: 1, unitPrice: 5000 }
    ]);

    const requested = await json<{ ok: boolean; approval: { id: string; requiredStages: string[] } }>(
      await request.post("/api/billing/approvals", {
        data: { kind: "Discount", invoiceId: invoice.id, amount: 500, discountType: "Senior Citizen", reason: "Senior citizen concession" }
      })
    );
    expect(requested.ok, JSON.stringify(requested)).toBe(true);
    expect((await readInvoice(request, invoice.id)).totalPaise, "bill unchanged while pending").toBe(500_000);

    // The whole point of the chain: the person who asked cannot also approve.
    const selfApprove = await request.patch("/api/billing/approvals", { data: { id: requested.approval.id, decision: "Approved" } });
    expect(selfApprove.status()).toBe(400);
    expect((await json<{ error: string }>(selfApprove)).error).toMatch(/can't also approve/i);
  });

  test("a bill with money collected cannot be cancelled, and cancelled bills are retained", async ({ request }) => {
    const paid = await seedVisit(request, "cancelpaid");
    const paidInvoice = await seedInvoice(request, paid.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }
    ]);
    await request.patch("/api/billing", { data: { action: "record-payment", id: paidInvoice.id, method: "Cash", amount: 500 } });

    const refused = await request.patch("/api/billing", { data: { action: "cancel", id: paidInvoice.id, reason: "test" } });
    expect(refused.status()).toBe(400);
    expect((await json<{ error: string }>(refused)).error).toMatch(/refund the payments/i);

    const clean = await seedVisit(request, "cancelclean");
    const cleanInvoice = await seedInvoice(request, clean.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 500 }
    ]);
    const cancelled = await request.patch("/api/billing", {
      data: { action: "cancel", id: cleanInvoice.id, reason: "Registered against the wrong patient" }
    });
    expect(cancelled.ok()).toBe(true);

    const retained = await readInvoice(request, cleanInvoice.id);
    expect(retained.status, "a cancelled bill is kept, never deleted").toBe("Cancelled");
  });
});

test.describe("price master", () => {
  test("changing a price needs a reason and leaves issued bills alone", async ({ request }) => {
    const suffix = RUN();
    const code = `E2E-${suffix}`;
    const created = await json<{ ok: boolean; service: { id: string } }>(
      await request.post("/api/pricing", {
        data: { kind: "service", code, name: `E2E service ${suffix}`, category: "Procedure", basePrice: 1000 }
      })
    );
    expect(created.ok, JSON.stringify(created)).toBe(true);

    const visit = await seedVisit(request, "price");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "Procedure", description: `E2E service ${suffix}`, category: "Procedure", quantity: 1, unitPrice: 1000 }
    ]);

    const noReason = await request.patch("/api/pricing", { data: { kind: "service", id: created.service.id, basePrice: 2000 } });
    expect(noReason.status()).toBe(400);
    expect((await json<{ error: string }>(noReason)).error).toMatch(/reason is required/i);

    const changed = await request.patch("/api/pricing", {
      data: { kind: "service", id: created.service.id, basePrice: 2000, reason: "Annual revision" }
    });
    expect(changed.ok()).toBe(true);

    // Historical immutability: the line froze its own total when it was added.
    expect((await readInvoice(request, invoice.id)).totalPaise).toBe(100_000);
  });
});

test.describe("collection desk UI", () => {
  test("a clerk can find a bill and collect against it", async ({ page, request }) => {
    const visit = await seedVisit(request, "ui");
    const invoice = await seedInvoice(request, visit.id, [
      { source: "Procedure", description: "Upper GI Endoscopy", category: "Procedure", quantity: 1, unitPrice: 4000 }
    ]);

    await page.request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
    await page.goto("/mudgalgastromedics-os/billing");

    await page.getByRole("tab", { name: /collection/i }).click();
    const desk = page.getByRole("region", { name: "Collection desk" });
    await expect(desk).toBeVisible();

    await desk.getByPlaceholder(/search invoice no/i).fill(invoice.invoiceNo);
    const row = page.getByRole("row", { name: new RegExp(invoice.invoiceNo) });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /collect/i }).click();
    const panel = page.getByRole("region", { name: `Invoice ${invoice.invoiceNo}` });
    await expect(panel).toBeVisible();
    // The amount field arrives pre-filled with the whole balance, so the
    // common case is Enter-Enter.
    await expect(page.locator("#collect-amount")).toHaveValue("4000");

    await page.getByRole("button", { name: /record payment/i }).click();

    await expect(async () => {
      expect((await readInvoice(request, invoice.id)).status).toBe("Paid");
    }).toPass({ timeout: 10_000 });
  });
});

test.describe("insurance settlement stays with the insured patient", () => {
  /**
   * A claim takes its patient from the visit it is filed against and is always
   * created as Draft, so approving it is a second call.
   */
  async function approvedClaim(request: APIRequestContext, visitId: string, approvedAmount: number) {
    const created = await json<{ ok: boolean; claim: { id: string } }>(
      await request.post("/api/finance", {
        data: { mode: "claim", visitId, insurer: "Star Health", requestedAmount: approvedAmount }
      })
    );
    expect(created.ok, JSON.stringify(created)).toBe(true);
    const approved = await json<{ ok: boolean; claim: { id: string; status: string } }>(
      await request.patch("/api/finance", { data: { id: created.claim.id, status: "Approved", approvedAmount } })
    );
    expect(approved.claim.status).toBe("Approved");
    return approved.claim;
  }

  async function settle(request: APIRequestContext, claimId: string, invoiceId: string, amount: number) {
    const response = await request.post("/api/billing/assistant", {
      data: { action: "settle-insurance", claimId, invoiceId, amount }
    });
    return { status: response.status(), body: await json<{ ok: boolean; error?: string; settledPaise?: number }>(response) };
  }

  /**
   * The guard is identity-based, and every other check on the path is bounded
   * by amount only — which a wrong-patient settlement passes cleanly. Without
   * it, one patient's approved cover writes off another patient's bill and the
   * insured patient is left unable to use cover they still need.
   */
  test("one patient's approved cover cannot settle another patient's bill", async ({ request }) => {
    const [visitA, visitB] = [await seedVisit(request, "ins-a"), await seedVisit(request, "ins-b")];
    const invoiceA = await seedInvoice(request, visitA.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 5000 }
    ]);
    const invoiceB = await seedInvoice(request, visitB.id, [
      { source: "OPD", description: "Consultation", category: "Consultation", quantity: 1, unitPrice: 5000 }
    ]);
    const claimA = await approvedClaim(request, visitA.id, 5000);

    const crossPatient = await settle(request, claimA.id, invoiceB.id, 5000);
    expect(crossPatient.status).toBe(400);
    expect(crossPatient.body.ok).toBe(false);
    expect(crossPatient.body.error).toMatch(/belongs to/i);

    // Refused before anything is written, on both sides of the money.
    const bAfter = await readInvoice(request, invoiceB.id);
    expect(bAfter.paidPaise).toBe(0);
    expect(bAfter.balancePaise).toBe(500_000);

    // The insured patient's own cover is still intact and still usable.
    const ownBill = await settle(request, claimA.id, invoiceA.id, 5000);
    expect(ownBill.status, JSON.stringify(ownBill.body)).toBe(200);
    expect(ownBill.body.settledPaise).toBe(500_000);

    const aAfter = await readInvoice(request, invoiceA.id);
    expect(aAfter.balancePaise).toBe(0);
    expect(aAfter.payments.some((payment) => payment.method === "Insurance")).toBe(true);
  });
});
