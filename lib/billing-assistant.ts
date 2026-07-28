import { formatPaise } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";
import { detectDuplicateCharges } from "@/lib/billing-workspace";
import type { InsuranceClaim } from "@/lib/finance-types";
import { packageBalance } from "@/lib/package-calc";
import type { PackagePurchase } from "@/lib/package-types";
import type { PatientWallet } from "@/lib/wallet-types";

/**
 * The billing assistant (Track 5.11, §30).
 *
 * **Deliberately a deterministic rule engine, not a language model.**
 *
 * The brief asks for recommendations about missing bill items, duplicate
 * charges, package eligibility, outstanding balances, insurance coverage and
 * revenue leakage. Every one of those is a rule over data this system already
 * holds — and rules beat a model here on every axis that matters at a billing
 * counter: they are explainable (each recommendation states the figures behind
 * it), deterministic (the same bill always produces the same advice), testable,
 * instant, and free. An LLM would add latency and cost to a queue, and could
 * not tell a clerk *why* it said what it said.
 *
 * Every recommendation is advisory. Nothing here mutates a bill; §30's own
 * rule is that the assistant recommends and never auto-bills.
 */

export type RecommendationKind =
  | "unbilled-charges"
  | "duplicate-charge"
  | "package-available"
  | "advance-available"
  | "insurance-available"
  | "outstanding-balance"
  | "unissued-draft";

export type RecommendationSeverity = "info" | "action" | "warning";

export type Recommendation = {
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  title: string;
  /** Always states the figures behind it — a recommendation nobody can check is one nobody should act on. */
  detail: string;
  /** What the clerk would do about it, in the words the UI uses. */
  suggestedAction?: string;
  amountPaise?: number;
};

export type AssistantContext = {
  /** The bill currently open, if any. */
  invoice?: Invoice | null;
  /** Every invoice for this patient, for outstanding and duplicate checks. */
  invoices: Invoice[];
  wallet?: PatientWallet | null;
  packages?: PackagePurchase[];
  insuranceClaims?: InsuranceClaim[];
  /** Charges the last clinical sync deliberately did not bill (Track 5.3). */
  skippedCharges?: Array<{ label: string; reason: string }>;
  now?: Date;
};

/**
 * Recommendations for the bill and patient in front of the clerk, ordered
 * with the ones that cost the hospital or the patient money first.
 */
export function recommendations(context: AssistantContext): Recommendation[] {
  const found: Recommendation[] = [];
  const now = context.now ?? new Date();
  const invoice = context.invoice ?? null;

  // 1. Revenue leakage: a clinical charge the sync could not bill. This is the
  //    single most common way a hospital loses money it has already spent.
  for (const skipped of context.skippedCharges ?? []) {
    if (/already collected|already paid|pharmacy counter|lab counter/i.test(skipped.reason)) continue;
    found.push({
      kind: "unbilled-charges",
      severity: "warning",
      title: `${skipped.label} was not billed`,
      detail: skipped.reason,
      suggestedAction: "Add it as a manual charge if it should be billed."
    });
  }

  // 2. Duplicates, reusing the same detection the workspace shows so the
  //    assistant can never disagree with the warning beside it.
  for (const duplicate of detectDuplicateCharges(context.invoices)) {
    found.push({
      kind: "duplicate-charge",
      severity: "warning",
      title: `Possible double charge: ${duplicate.label}`,
      detail: `${duplicate.detail} (${duplicate.invoiceNos.join(", ")})`,
      suggestedAction: "Check before collecting; remove the charge if it is a duplicate.",
      amountPaise: duplicate.amountPaise
    });
  }

  // 3. Package eligibility: the patient has already paid for something they
  //    are about to be charged for again.
  if (invoice) {
    const balances = (context.packages ?? []).map((purchase) => packageBalance(purchase, now)).filter((balance) => !balance.expired);

    for (const balance of balances) {
      for (const entitlement of balance.lines) {
        if (entitlement.remaining <= 0) continue;
        const chargedAnyway = invoice.lineItems.find(
          (line) => line.unitPricePaise > 0 && line.description.toLowerCase().includes(entitlement.name.toLowerCase())
        );
        if (!chargedAnyway) continue;

        found.push({
          kind: "package-available",
          severity: "action",
          title: `${entitlement.name} is covered by ${balance.packageName}`,
          detail: `${entitlement.remaining} remaining, but it is charged at ${formatPaise(chargedAnyway.totalPaise)} on this bill.`,
          suggestedAction: "Redeem it from the package instead of charging for it.",
          amountPaise: chargedAnyway.totalPaise
        });
      }
    }
  }

  // 4. Advance sitting unused while a bill is owed.
  const walletBalance = context.wallet?.balancePaise ?? 0;
  if (invoice && walletBalance > 0 && invoice.balancePaise > 0 && invoice.status !== "Draft") {
    const applicable = Math.min(walletBalance, invoice.balancePaise);
    found.push({
      kind: "advance-available",
      severity: "action",
      title: `${formatPaise(walletBalance)} advance is available`,
      detail: `${formatPaise(applicable)} of it can settle this bill's ${formatPaise(invoice.balancePaise)} balance.`,
      suggestedAction: "Apply the advance before asking for payment.",
      amountPaise: applicable
    });
  }

  // 5. An approved but unsettled claim while the patient is being asked to pay.
  const openClaims = (context.insuranceClaims ?? []).filter(
    (claim) => claim.status === "Approved" && claim.approvedAmount > claim.settledAmount
  );
  if (invoice && invoice.balancePaise > 0 && openClaims.length) {
    const coverPaise = openClaims.reduce((sum, claim) => sum + Math.round((claim.approvedAmount - claim.settledAmount) * 100), 0);
    found.push({
      kind: "insurance-available",
      severity: "action",
      title: `${formatPaise(coverPaise)} of approved insurance is unsettled`,
      detail: `${openClaims.map((claim) => claim.insurer).join(", ")} approved cover that has not been applied to a bill yet.`,
      suggestedAction: "Record the insurance settlement against this bill before collecting from the patient."
    });
  }

  // 6. Older unpaid bills the desk should collect while the patient is here.
  const otherOutstanding = context.invoices.filter(
    (entry) => entry.id !== invoice?.id && entry.status !== "Cancelled" && entry.status !== "Draft" && entry.balancePaise > 0
  );
  if (otherOutstanding.length) {
    const totalPaise = otherOutstanding.reduce((sum, entry) => sum + entry.balancePaise, 0);
    found.push({
      kind: "outstanding-balance",
      severity: "action",
      title: `${formatPaise(totalPaise)} outstanding on ${otherOutstanding.length} earlier ${otherOutstanding.length === 1 ? "bill" : "bills"}`,
      detail: otherOutstanding.map((entry) => `${entry.invoiceNo} ${formatPaise(entry.balancePaise)}`).join(", "),
      suggestedAction: "Collect the dues while the patient is at the counter.",
      amountPaise: totalPaise
    });
  }

  // 7. A draft that never became a demand for payment — revenue that exists
  //    only in the system.
  const staleDrafts = context.invoices.filter(
    (entry) => entry.status === "Draft" && entry.totalPaise > 0 && (now.getTime() - new Date(entry.createdAt).getTime()) / 86_400_000 > 1
  );
  if (staleDrafts.length) {
    found.push({
      kind: "unissued-draft",
      severity: "warning",
      title: `${staleDrafts.length} draft ${staleDrafts.length === 1 ? "bill has" : "bills have"} never been issued`,
      detail: staleDrafts.map((entry) => `${entry.invoiceNo} ${formatPaise(entry.totalPaise)}`).join(", "),
      suggestedAction: "Issue it, or cancel it with a reason.",
      amountPaise: staleDrafts.reduce((sum, entry) => sum + entry.totalPaise, 0)
    });
  }

  const order: Record<RecommendationSeverity, number> = { warning: 0, action: 1, info: 2 };
  return found.sort((a, b) => order[a.severity] - order[b.severity] || (b.amountPaise ?? 0) - (a.amountPaise ?? 0));
}
