"use client";

import { AlertTriangle, CalendarClock, ShieldCheck, Stethoscope } from "lucide-react";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";
import type { BillingTotals, DuplicateWarning, PaymentHistoryEntry } from "@/lib/billing-workspace";
import type { InsuranceClaim } from "@/lib/finance-types";
import type { OpdVisit } from "@/lib/opd-types";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";

const claimTone: Record<InsuranceClaim["status"], BadgeTone> = {
  Draft: "inactive",
  "Preauth Sent": "info",
  Approved: "success",
  Rejected: "critical",
  Submitted: "warning",
  Settled: "success"
};

const invoiceTone: Record<Invoice["status"], BadgeTone> = {
  Draft: "inactive",
  Issued: "info",
  "Partially Paid": "warning",
  Paid: "success",
  Cancelled: "critical"
};

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export type WorkspacePatient = { name: string; phone: string; uhid?: string; patientId?: string };

type Props = {
  patient: WorkspacePatient;
  latestVisit: OpdVisit | null;
  totals: BillingTotals;
  invoices: Invoice[];
  payments: PaymentHistoryEntry[];
  insuranceClaims: InsuranceClaim[];
  duplicateWarnings: DuplicateWarning[];
  currentInvoiceId?: string;
  onOpenInvoice: (invoiceId: string) => void;
};

/**
 * The patient-context half of the billing workspace (Track 5.4) — who the
 * patient is, what they owe, what they have been billed before, what has been
 * collected, and where insurance stands.
 *
 * Everything here is read-only context. Acting on the bill happens in the
 * collection panel beside it, so the desk never has to leave the screen to
 * answer "what does this patient actually owe?".
 */
export function BillingWorkspaceSummary({
  patient,
  latestVisit,
  totals,
  invoices,
  payments,
  insuranceClaims,
  duplicateWarnings,
  currentInvoiceId,
  onOpenInvoice
}: Props) {
  const previousInvoices = invoices.filter((invoice) => invoice.id !== currentInvoiceId);

  return (
    <div className="grid gap-4">
      <section aria-label="Patient summary" className="rounded border border-line bg-surface p-4">
        <h3 className="text-lg font-bold text-ink">{patient.name}</h3>
        <p className="text-xs text-muted">{[patient.uhid, patient.phone].filter(Boolean).join(" · ")}</p>

        {latestVisit ? (
          <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Latest visit</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-ink">
                <CalendarClock size={13} className="text-brand" /> {dateLabel(latestVisit.createdAt)} · {latestVisit.token}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Department</dt>
              <dd className="font-semibold text-ink">{latestVisit.service || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Doctor</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-ink">
                <Stethoscope size={13} className="text-brand" /> {latestVisit.doctorName || "Not yet attributed"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Visit status</dt>
              <dd className="font-semibold text-ink">{latestVisit.status}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {duplicateWarnings.length ? (
        // Advisory, never blocking: a patient can legitimately have the same
        // procedure twice. The desk decides; this explains why it asked.
        <section
          aria-label="Possible duplicate charges"
          className="rounded border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink">
            <AlertTriangle size={13} /> Check before collecting
          </p>
          <ul className="mt-2 grid gap-2 text-sm">
            {duplicateWarnings.map((warning) => (
              <li key={`${warning.kind}-${warning.label}-${warning.invoiceNos.join()}`}>
                <span className="font-bold text-ink">{warning.label}</span>{" "}
                <span className="font-semibold tabular-nums text-ink">{formatPaise(warning.amountPaise)}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {warning.detail} ({warning.invoiceNos.join(", ")})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Account totals" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-soft/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Outstanding</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${totals.outstandingPaise > 0 ? "text-coral" : "text-teal-dark"}`}>
            {formatPaise(totals.outstandingPaise)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {totals.openInvoiceCount} unpaid {totals.openInvoiceCount === 1 ? "bill" : "bills"}
          </p>
        </div>
        <div className="rounded border border-line bg-soft/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Collected to date</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{formatPaise(totals.lifetimeCollectedPaise)}</p>
          <p className="mt-1 text-xs text-muted">of {formatPaise(totals.lifetimeBilledPaise)} billed</p>
        </div>
      </section>

      {insuranceClaims.length ? (
        <section aria-label="Insurance" className="rounded border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
            <ShieldCheck size={13} /> Insurance
          </p>
          <ul className="mt-2 grid gap-2">
            {insuranceClaims.map((claim) => (
              <li key={claim.id} className="grid gap-1 rounded border border-line px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <span className="font-semibold text-ink">{claim.insurer}</span>
                  {claim.tpa ? <span className="ml-2 text-xs text-muted">TPA {claim.tpa}</span> : null}
                  <span className="mt-0.5 block text-xs text-muted">
                    Requested {formatPaise(Math.round(claim.requestedAmount * 100))} · approved{" "}
                    {formatPaise(Math.round(claim.approvedAmount * 100))} · settled {formatPaise(Math.round(claim.settledAmount * 100))}
                  </span>
                </div>
                <StatusBadge tone={claimTone[claim.status]} className="justify-self-start rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide sm:justify-self-end">
                  {claim.status}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Previous bills" className="rounded border border-line bg-surface p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Previous bills</p>
        {previousInvoices.length ? (
          <ul className="mt-2 grid gap-1.5">
            {previousInvoices.map((invoice) => (
              <li key={invoice.id}>
                <button
                  type="button"
                  onClick={() => onOpenInvoice(invoice.id)}
                  className="grid w-full gap-1 rounded border border-line px-3 py-2 text-left text-sm transition hover:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3"
                >
                  <span>
                    <span className="font-mono text-xs font-bold text-ink">{invoice.invoiceNo}</span>
                    <span className="mt-0.5 block text-xs text-muted">{dateLabel(invoice.createdAt)}</span>
                  </span>
                  <StatusBadge tone={invoiceTone[invoice.status]} className="justify-self-start rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {invoice.status}
                  </StatusBadge>
                  <span className="font-bold tabular-nums text-ink sm:text-right">{formatPaise(invoice.totalPaise)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No earlier bills for this patient.</p>
        )}
      </section>

      <section aria-label="Payment history" className="rounded border border-line bg-surface p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Payment history</p>
        {payments.length ? (
          <ul className="mt-2 grid gap-1.5">
            {payments.map((payment) => (
              <li
                key={payment.paymentId}
                className="grid gap-1 rounded border border-line px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-3"
              >
                <span className="font-semibold text-ink">
                  {payment.method}
                  {payment.reference ? <span className="ml-2 font-mono text-[11px] text-muted">{payment.reference}</span> : null}
                  <span className="mt-0.5 block font-mono text-[11px] text-muted">{payment.invoiceNo}</span>
                </span>
                <span className="text-xs text-muted">
                  {timeLabel(payment.receivedAt)} · {payment.receivedBy}
                </span>
                <span className="font-bold tabular-nums text-teal-dark sm:text-right">{formatPaise(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Nothing collected from this patient yet.</p>
        )}
      </section>
    </div>
  );
}
