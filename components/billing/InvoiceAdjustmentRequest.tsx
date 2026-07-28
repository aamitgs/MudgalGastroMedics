"use client";

import { Scale } from "lucide-react";
import { useState } from "react";
import type { ApprovalKind, DiscountType } from "@/lib/billing-approval-types";
import { discountTypes } from "@/lib/billing-approval-types";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice, InvoicePaymentMethod } from "@/lib/billing-types";
import { invoicePaymentMethods } from "@/lib/billing-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormField } from "@/components/design-system/FormField";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export type AdjustmentRequest = {
  kind: ApprovalKind;
  reason: string;
  amount?: number;
  percent?: number;
  discountType?: DiscountType;
  refundMethod?: InvoicePaymentMethod;
};

type Props = {
  invoice: Invoice;
  busy?: boolean;
  onRequest: (request: AdjustmentRequest) => Promise<void>;
};

/**
 * Raises a discount, refund or cancellation request against a bill
 * (Track 5.6, §10/§22/§23).
 *
 * Deliberately a *request*, not an action: whoever wants the concession and
 * whoever authorises it are different people, and the wording says so, so
 * nobody expects the bill to change when they submit.
 */
export function InvoiceAdjustmentRequest({ invoice, busy, onRequest }: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ApprovalKind>("Discount");
  const [discountType, setDiscountType] = useState<DiscountType>("Fixed Amount");
  const [amount, setAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<InvoicePaymentMethod>("Cash");
  const [reason, setReason] = useState("");

  const byPercent = kind === "Discount" && discountType === "Percentage";
  const canSubmit = reason.trim().length >= 3 && (kind === "Cancellation" || Number(amount) > 0);

  async function submit() {
    if (!canSubmit) return;
    await onRequest({
      kind,
      reason,
      amount: kind === "Cancellation" || byPercent ? undefined : Number(amount),
      percent: byPercent ? Number(amount) : undefined,
      discountType: kind === "Discount" ? discountType : undefined,
      refundMethod: kind === "Refund" ? refundMethod : undefined
    });
    setAmount("");
    setReason("");
    setOpen(false);
  }

  if (!open) {
    return (
      <ActionButton variant="outline" size="sm" className="justify-self-start" onClick={() => setOpen(true)}>
        <Scale size={14} /> Request discount, refund or cancellation
      </ActionButton>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="grid gap-3 rounded border border-line bg-soft/60 p-3"
    >
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <Scale size={13} /> Raise a request
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        <FormField label="Request" htmlFor="adjust-kind" required>
          <select id="adjust-kind" className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as ApprovalKind)}>
            <option value="Discount">Discount</option>
            <option value="Refund" disabled={invoice.paidPaise <= 0}>
              Refund{invoice.paidPaise <= 0 ? " (nothing collected yet)" : ""}
            </option>
            <option value="Cancellation">Cancellation</option>
          </select>
        </FormField>

        {kind === "Discount" ? (
          <FormField label="Discount type" htmlFor="adjust-discount-type" required>
            <select
              id="adjust-discount-type"
              className={fieldClass}
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as DiscountType)}
            >
              {discountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        {kind === "Refund" ? (
          <FormField label="Refund by" htmlFor="adjust-refund-method" required>
            <select
              id="adjust-refund-method"
              className={fieldClass}
              value={refundMethod}
              onChange={(event) => setRefundMethod(event.target.value as InvoicePaymentMethod)}
            >
              {invoicePaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
      </div>

      {kind !== "Cancellation" ? (
        <FormField
          label={byPercent ? "Percentage" : "Amount"}
          htmlFor="adjust-amount"
          required
          hint={
            kind === "Refund"
              ? `Collected ${formatPaise(invoice.paidPaise)}`
              : byPercent
                ? `Of ${formatPaise(invoice.totalPaise)}`
                : `Bill total ${formatPaise(invoice.totalPaise)}`
          }
        >
          <input
            id="adjust-amount"
            className={fieldClass}
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormField>
      ) : (
        <p className="text-sm text-muted">
          Cancelling voids the whole bill ({formatPaise(invoice.totalPaise)}). The invoice is kept with its reason and approvers.
        </p>
      )}

      <FormField label="Reason" htmlFor="adjust-reason" required hint="An approver has to act on this, so be specific">
        <input
          id="adjust-reason"
          className={fieldClass}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. senior citizen concession approved verbally by Dr Mudgal"
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-2">
        <ActionButton type="submit" variant="primary" size="sm" loading={busy} disabled={!canSubmit}>
          Send for approval
        </ActionButton>
        <ActionButton type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </ActionButton>
        <p className="text-xs text-muted">Nothing changes on the bill until it is signed off.</p>
      </div>
    </form>
  );
}
