import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listPatientInvoices } from "@/lib/billing-store";
import { billingTotals, detectDuplicateCharges, paymentHistory } from "@/lib/billing-workspace";
import { recommendations } from "@/lib/billing-assistant";
import { listPatientInsuranceClaims } from "@/lib/finance-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { effectiveStatus } from "@/lib/estimate-calc";
import { listPatientEstimates } from "@/lib/estimate-store";
import { packageBalance } from "@/lib/package-calc";
import { listPatientPackages, refreshPackageStatuses } from "@/lib/package-store";
import { summariseWallet } from "@/lib/wallet-calc";
import { getWallet } from "@/lib/wallet-store";

/**
 * Everything the unified billing workspace shows for one patient, in a single
 * round trip (Track 5.4).
 *
 * Deliberately one aggregate endpoint rather than the four or five calls the
 * screen would otherwise fan out: §29 budgets the whole screen at well under a
 * second, and a billing counter with a queue in front of it cannot absorb
 * serial round-trips. Each underlying store is already narrowed by phone
 * server-side, so nothing here ships a whole hospital's data to filter one
 * patient out of it.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ ok: false, error: "A patient phone number is required." }, { status: 400 });

  // Package statuses refresh on read so a lapsed package never reads Active.
  await refreshPackageStatuses();

  const [invoices, visits, insuranceClaims, wallet, packages, estimates] = await Promise.all([
    listPatientInvoices(phone),
    listPatientOpdVisits(phone),
    listPatientInsuranceClaims(phone),
    getWallet(phone),
    listPatientPackages(phone),
    listPatientEstimates(phone)
  ]);

  if (!invoices.length && !visits.length) {
    return NextResponse.json({ ok: false, error: "No billing or visit history found for that patient." }, { status: 404 });
  }

  const sortedInvoices = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sortedVisits = [...visits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestVisit = sortedVisits[0];

  // The bill the desk is most likely here to act on: the live one against the
  // most recent visit, else the newest invoice still owing money.
  const currentInvoice =
    sortedInvoices.find((invoice) => invoice.visitId === latestVisit?.id && invoice.status !== "Cancelled") ??
    sortedInvoices.find((invoice) => invoice.status !== "Cancelled" && invoice.balancePaise > 0) ??
    null;

  const identity = sortedInvoices[0] ?? latestVisit;

  return NextResponse.json({
    ok: true,
    workspace: {
      patient: {
        name: identity?.patientName ?? "",
        phone: identity?.phone ?? phone,
        uhid: identity?.uhid,
        patientId: identity?.patientId
      },
      latestVisit: latestVisit ?? null,
      recentVisits: sortedVisits.slice(0, 5),
      currentInvoice,
      invoices: sortedInvoices,
      totals: billingTotals(sortedInvoices),
      payments: paymentHistory(sortedInvoices),
      insuranceClaims,
      wallet,
      walletSummary: summariseWallet(wallet?.transactions ?? []),
      packageBalances: packages.map((purchase) => packageBalance(purchase)),
      estimates: estimates
        .map((estimate) => ({ ...estimate, effectiveStatus: effectiveStatus(estimate) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      duplicateWarnings: detectDuplicateCharges(sortedInvoices),
      // The assistant (Track 5.11) runs on data this request already loaded,
      // so it costs nothing extra and can never disagree with the figures
      // rendered beside it.
      recommendations: recommendations({
        invoice: currentInvoice,
        invoices: sortedInvoices,
        wallet,
        packages,
        insuranceClaims
      })
    }
  });
}
