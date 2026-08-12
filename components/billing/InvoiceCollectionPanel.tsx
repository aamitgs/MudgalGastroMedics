"use client";

import { AlertTriangle, BadgeIndianRupee, Banknote, FileCheck2, Mail, Receipt, RefreshCw, Send, Wallet } from "lucide-react";
import { useEffect } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice, InvoicePaymentMethod } from "@/lib/billing-types";
import { invoicePaymentMethods } from "@/lib/billing-types";
import { invoicePaymentFormSchema, type InvoicePaymentFormInput } from "@/lib/validation/billing";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormField } from "@/components/design-system/FormField";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceAdjustmentRequest, type AdjustmentRequest } from "@/components/billing/InvoiceAdjustmentRequest";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const statusTone: Record<Invoice["status"], BadgeTone> = {
  Draft: "inactive",
  Issued: "info",
  "Partially Paid": "warning",
  Paid: "success",
  Cancelled: "critical"
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export type SkippedCharge = { label: string; reason: string };

type Props = {
  invoice: Invoice;
  onIssue: (invoice: Invoice) => Promise<void>;
  onCollect: (invoice: Invoice, payment: InvoicePaymentFormInput) => Promise<boolean>;
  onSyncCharges: (invoice: Invoice) => Promise<void>;
  /** Omitted where raising adjustment requests isn't offered (e.g. the collection desk). */
  onRequestAdjustment?: (invoice: Invoice, request: AdjustmentRequest) => Promise<void>;
  /** Omitted where sending to the patient isn't offered. */
  onSend?: (invoice: Invoice, channel: "Email" | "WhatsApp", to?: string) => Promise<void>;
  onClose: () => void;
  busy?: boolean;
  /** Charges the last sync deliberately did not bill, with the reason for each. */
  skipped?: SkippedCharge[];
};

/**
 * The payment collection screen for one invoice (Track 5.2).
 *
 * A split payment is simply several tenders recorded in turn — there is no
 * separate "split" mode to enter, because at a counter the second tender is
 * usually only discovered when the first one comes up short. The amount field
 * defaults to the whole remaining balance so the common case (one tender,
 * settles the bill) is Enter-Enter, while a part payment just means typing a
 * smaller number.
 */
export function InvoiceCollectionPanel({ invoice, onIssue, onCollect, onSyncCharges, onRequestAdjustment, onSend, onClose, busy, skipped }: Props) {
  const settled = invoice.balancePaise <= 0;
  const collectable = invoice.status === "Issued" || invoice.status === "Partially Paid";

  const form = useAdvancedForm<InvoicePaymentFormInput>({
    schema: invoicePaymentFormSchema,
    defaultValues: { method: "Cash", amount: invoice.balancePaise / 100, reference: "", note: "" },
    async onValid(values) {
      const ok = await onCollect(invoice, values);
      if (ok) form.reset({ method: values.method, amount: 0, reference: "", note: "" });
    }
  });

  const { reset } = form;
  // Re-arm for the *remaining* balance whenever the invoice changes underneath
  // the panel — after a part payment, the next tender should default to what
  // is still owed rather than to the amount just collected.
  useEffect(() => {
    reset({ method: "Cash", amount: invoice.balancePaise / 100, reference: "", note: "" });
  }, [invoice.id, invoice.balancePaise, reset]);

  return (
    <section aria-label={`Invoice ${invoice.invoiceNo}`} className="grid gap-4 rounded border border-line bg-surface p-4 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand">
            <Receipt size={13} /> {invoice.invoiceNo}
            <StatusBadge tone={statusTone[invoice.status]} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {invoice.status}
            </StatusBadge>
          </p>
          <h3 className="mt-1 text-lg font-bold text-ink">{invoice.patientName}</h3>
          <p className="text-xs text-muted">
            {[invoice.uhid, invoice.admissionNo ?? invoice.visitNo, invoice.phone, invoice.department, invoice.doctorName].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ActionButton variant="ghost" size="sm" onClick={onClose}>
          Close
        </ActionButton>
      </header>

      {invoice.visitId && invoice.status !== "Cancelled" && invoice.status !== "Paid" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/60 p-3">
          <p className="text-sm text-muted">
            Pull consultation, lab, pharmacy and procedure charges from this visit. Already-billed items are left alone.
          </p>
          <ActionButton variant="secondary" size="sm" loading={busy} onClick={() => void onSyncCharges(invoice)}>
            <RefreshCw size={14} /> Pull charges
          </ActionButton>
        </div>
      ) : null}

      {skipped?.length ? (
        <div className="grid gap-1.5 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink">
            <AlertTriangle size={13} /> Not billed automatically
          </p>
          <ul className="grid gap-1 text-sm text-ink">
            {skipped.map((item) => (
              <li key={`${item.label}-${item.reason}`}>
                <span className="font-semibold">{item.label}</span> — {item.reason}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Add anything that should still be charged as a manual line.</p>
        </div>
      ) : null}

      {invoice.lineItems.length === 0 ? (
        <p className="rounded border border-dashed border-line p-4 text-center text-sm text-muted">
          No charges on this invoice yet. Pull them from the visit, or add a line manually.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Charge</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lineItems.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <span className="font-semibold text-ink">{line.description}</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted">
                    {line.category} · {line.source}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPaise(line.unitPricePaise)}</TableCell>
                <TableCell className="text-right tabular-nums">{line.taxPaise ? formatPaise(line.taxPaise) : "—"}</TableCell>
                <TableCell className="text-right font-bold tabular-nums text-ink">{formatPaise(line.totalPaise)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Constrained rather than full-width: a label/value pair stretched
          across a wide counter monitor strands the number metres from what it
          is labelled as. Left-aligned deliberately — the OS shell currently
          over-widens its content container on every module page, and a
          right-floated block would land off-screen. */}
      <dl className="grid w-full max-w-sm gap-1.5 rounded border border-line bg-soft/60 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-ink">{formatPaise(invoice.subtotalPaise)}</dd>
        </div>
        {invoice.discountPaise > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted">Discount{invoice.discountReason ? ` — ${invoice.discountReason}` : ""}</dt>
            <dd className="font-semibold tabular-nums text-ink">−{formatPaise(invoice.discountPaise)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-1.5">
          <dt className="font-bold text-ink">Total</dt>
          <dd className="font-bold tabular-nums text-ink">{formatPaise(invoice.totalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Collected</dt>
          <dd className="font-semibold tabular-nums text-teal-dark">{formatPaise(invoice.paidPaise)}</dd>
        </div>
        {invoice.refundedPaise > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted">Refunded</dt>
            <dd className="font-semibold tabular-nums text-coral">−{formatPaise(invoice.refundedPaise)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-1.5">
          <dt className="font-bold text-ink">Balance due</dt>
          <dd className={`text-base font-bold tabular-nums ${settled ? "text-teal-dark" : "text-coral"}`}>
            {formatPaise(invoice.balancePaise)}
          </dd>
        </div>
      </dl>

      {invoice.payments.length ? (
        <div className="grid gap-1.5">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
            <Wallet size={13} /> Payments received
          </p>
          <ul className="grid gap-1">
            {invoice.payments.map((payment) => (
              <li
                key={payment.id}
                className="grid grid-cols-[minmax(0,1fr)] gap-1 rounded border border-line bg-surface px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-4"
              >
                <span className="font-semibold text-ink">
                  {payment.method}
                  {payment.reference ? <span className="ml-2 font-mono text-[11px] text-muted">{payment.reference}</span> : null}
                </span>
                <span className="text-xs text-muted">
                  {timeLabel(payment.receivedAt)} · {payment.receivedBy}
                </span>
                <span className="font-bold tabular-nums text-teal-dark sm:text-right">{formatPaise(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {invoice.status === "Draft" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/60 p-3">
          <p className="text-sm text-muted">
            Verify the charges above, then issue this invoice. Payment can only be collected once it is issued.
          </p>
          <ActionButton variant="primary" size="sm" loading={busy} onClick={() => void onIssue(invoice)}>
            <FileCheck2 size={14} /> Issue invoice
          </ActionButton>
        </div>
      ) : null}

      {collectable && !settled ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
          className="grid gap-3 rounded border border-line bg-soft/60 p-3"
        >
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
            <BadgeIndianRupee size={13} /> Collect payment
          </p>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <FormField label="Method" htmlFor="collect-method" required error={form.formState.errors.method?.message}>
              <select id="collect-method" className={fieldClass} {...form.register("method")}>
                {invoicePaymentMethods.map((method: InvoicePaymentMethod) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Amount"
              htmlFor="collect-amount"
              required
              error={form.formState.errors.amount?.message}
              hint={`Balance ${formatPaise(invoice.balancePaise)}`}
            >
              <input
                id="collect-amount"
                className={fieldClass}
                inputMode="decimal"
                autoComplete="off"
                {...form.register("amount")}
              />
            </FormField>

            <FormField label="Reference" htmlFor="collect-reference" hint="UPI txn, cheque no., card auth — reconciles at day close">
              <input id="collect-reference" className={fieldClass} autoComplete="off" {...form.register("reference")} />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton type="submit" variant="success" size="sm" loading={busy}>
              <Banknote size={14} /> Record payment
            </ActionButton>
            <ActionButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue("amount", invoice.balancePaise / 100, { shouldValidate: true })}
            >
              Full balance
            </ActionButton>
            <p className="text-xs text-muted">Paying by more than one method? Record each tender in turn.</p>
          </div>
        </form>
      ) : null}

      {settled && invoice.status === "Paid" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm font-semibold text-ink">
            Settled in full — {formatPaise(invoice.totalPaise)} across {invoice.payments.length}{" "}
            {invoice.payments.length === 1 ? "tender" : "tenders"}.
          </p>
          {invoice.visitId ? (
            <PdfPreviewButton
              href={`/api/pdf/invoice?visitId=${encodeURIComponent(invoice.visitId)}`}
              title={`Receipt — ${invoice.patientName}`}
              description={`${invoice.invoiceNo} · ${formatPaise(invoice.totalPaise)}`}
              label="Receipt"
              size="sm"
              className="min-h-8 px-2 text-xs"
            />
          ) : null}
        </div>
      ) : null}

      {invoice.refunds?.length ? (
        <div className="grid gap-1.5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Refunds</p>
          <ul className="grid gap-1">
            {invoice.refunds.map((refund) => (
              <li
                key={refund.id}
                className="grid grid-cols-[minmax(0,1fr)] gap-1 rounded border border-line bg-surface px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-4"
              >
                <span className="font-semibold text-ink">
                  {refund.method}
                  <span className="mt-0.5 block text-xs text-muted">{refund.reason}</span>
                </span>
                <span className="text-xs text-muted">
                  {timeLabel(refund.refundedAt)} · {refund.refundedBy}
                </span>
                <span className="font-bold tabular-nums text-coral sm:text-right">−{formatPaise(refund.amountPaise)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {onSend && invoice.status !== "Draft" && invoice.status !== "Cancelled" ? (
        <div className="flex flex-wrap items-center gap-2 rounded border border-line bg-soft/60 p-3">
          <p className="mr-auto text-sm text-muted">Send this {settled ? "receipt" : "bill"} to the patient.</p>
          <ActionButton variant="secondary" size="sm" loading={busy} onClick={() => void onSend(invoice, "WhatsApp")}>
            <Send size={14} /> WhatsApp
          </ActionButton>
          <ActionButton variant="secondary" size="sm" loading={busy} onClick={() => void onSend(invoice, "Email")}>
            <Mail size={14} /> Email
          </ActionButton>
        </div>
      ) : null}

      {onRequestAdjustment && invoice.status !== "Draft" && invoice.status !== "Cancelled" ? (
        <InvoiceAdjustmentRequest invoice={invoice} busy={busy} onRequest={(request) => onRequestAdjustment(invoice, request)} />
      ) : null}

      {invoice.status === "Cancelled" ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-ink dark:border-red-900 dark:bg-red-950">
          Cancelled {invoice.cancelledAt ? `on ${timeLabel(invoice.cancelledAt)}` : ""}
          {invoice.cancelledBy ? ` by ${invoice.cancelledBy}` : ""} — {invoice.cancelReason}
        </p>
      ) : null}
    </section>
  );
}
