"use client";

import { PiggyBank, Undo2 } from "lucide-react";
import { useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { InvoicePaymentMethod } from "@/lib/billing-types";
import { invoicePaymentMethods } from "@/lib/billing-types";
import type { WalletSummary } from "@/lib/wallet-calc";
import type { PatientWallet } from "@/lib/wallet-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormField } from "@/components/design-system/FormField";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

type Props = {
  wallet: PatientWallet | null;
  summary: WalletSummary;
  /** Balance still owed on the open bill, so applying an advance can offer the right amount. */
  openInvoiceBalancePaise: number;
  canRefund: boolean;
  busy?: boolean;
  onDeposit: (amount: number, method: InvoicePaymentMethod, reference: string) => Promise<void>;
  onApply: (amount: number) => Promise<void>;
  onRefund: (amount: number, method: InvoicePaymentMethod, reason: string) => Promise<void>;
};

/**
 * Advance wallet for one patient (Track 5.5, §6).
 *
 * The ledger is shown in full rather than just a balance: a patient asking
 * "where did my deposit go?" is answered on this screen, not by an accountant
 * later. Every entry states what it was, which bill it went to, and who
 * recorded it.
 *
 * Refund is deliberately behind its own disclosure and a mandatory reason —
 * it is the one action here that sends money out of the hospital.
 */
export function AdvanceWalletPanel({ wallet, summary, openInvoiceBalancePaise, canRefund, busy, onDeposit, onApply, onRefund }: Props) {
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<InvoicePaymentMethod>("Cash");
  const [depositReference, setDepositReference] = useState("");
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<InvoicePaymentMethod>("Cash");
  const [refundReason, setRefundReason] = useState("");

  const balancePaise = wallet?.balancePaise ?? 0;
  const applicablePaise = Math.min(balancePaise, openInvoiceBalancePaise);

  async function submitDeposit() {
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await onDeposit(amount, depositMethod, depositReference);
    setDepositAmount("");
    setDepositReference("");
  }

  async function submitRefund() {
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !refundReason.trim()) return;
    await onRefund(amount, refundMethod, refundReason);
    setRefundAmount("");
    setRefundReason("");
    setShowRefund(false);
  }

  return (
    <section aria-label="Advance wallet" className="grid gap-3 rounded border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
          <PiggyBank size={13} /> Advance wallet
        </p>
        <p className={`text-xl font-bold tabular-nums ${balancePaise > 0 ? "text-teal-dark" : "text-muted"}`}>{formatPaise(balancePaise)}</p>
      </div>

      {applicablePaise > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-teal/30 bg-teal/5 p-3">
          <p className="text-sm text-ink">
            <span className="font-bold">{formatPaise(applicablePaise)}</span> of this advance can settle the open bill.
          </p>
          <ActionButton variant="success" size="sm" loading={busy} onClick={() => void onApply(applicablePaise / 100)}>
            Apply to bill
          </ActionButton>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitDeposit();
        }}
        className="grid gap-3 rounded border border-line bg-soft/60 p-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Take a deposit</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <FormField label="Amount" htmlFor="deposit-amount" required>
            <input
              id="deposit-amount"
              className={fieldClass}
              inputMode="decimal"
              autoComplete="off"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
            />
          </FormField>
          <FormField label="Method" htmlFor="deposit-method" required>
            <select
              id="deposit-method"
              className={fieldClass}
              value={depositMethod}
              onChange={(event) => setDepositMethod(event.target.value as InvoicePaymentMethod)}
            >
              {invoicePaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Reference" htmlFor="deposit-reference" hint="UPI txn, cheque no. — reconciles at day close">
          <input
            id="deposit-reference"
            className={fieldClass}
            autoComplete="off"
            value={depositReference}
            onChange={(event) => setDepositReference(event.target.value)}
          />
        </FormField>
        <ActionButton type="submit" variant="primary" size="sm" loading={busy} className="justify-self-start">
          <PiggyBank size={14} /> Record deposit
        </ActionButton>
      </form>

      {wallet?.transactions.length ? (
        <div className="grid gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Wallet ledger</p>
          <ul className="grid gap-1">
            {wallet.transactions.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-1 rounded border border-line px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-3"
              >
                <span className="font-semibold text-ink">
                  {entry.type}
                  {entry.invoiceNo ? <span className="ml-2 font-mono text-[11px] text-muted">{entry.invoiceNo}</span> : null}
                  {entry.reason ? <span className="mt-0.5 block text-xs text-muted">{entry.reason}</span> : null}
                </span>
                <span className="text-xs text-muted">
                  {timeLabel(entry.createdAt)} · {entry.recordedBy}
                </span>
                <span className={`font-bold tabular-nums sm:text-right ${entry.type === "Deposit" ? "text-teal-dark" : "text-ink"}`}>
                  {entry.type === "Deposit" ? "+" : "−"}
                  {formatPaise(entry.amountPaise)}
                  <span className="block text-[10px] font-semibold text-muted">bal {formatPaise(entry.balanceAfterPaise)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Deposited {formatPaise(summary.depositedPaise)} · applied {formatPaise(summary.adjustedPaise)} · refunded{" "}
            {formatPaise(summary.refundedPaise)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">No advance taken from this patient yet.</p>
      )}

      {canRefund && balancePaise > 0 ? (
        showRefund ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitRefund();
            }}
            className="grid gap-3 rounded border border-line bg-soft/60 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Refund unused advance</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Amount" htmlFor="refund-amount" required hint={`Available ${formatPaise(balancePaise)}`}>
                <input
                  id="refund-amount"
                  className={fieldClass}
                  inputMode="decimal"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                />
              </FormField>
              <FormField label="Paid back by" htmlFor="refund-method" required>
                <select
                  id="refund-method"
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
            </div>
            <FormField label="Reason" htmlFor="refund-reason" required>
              <input
                id="refund-reason"
                className={fieldClass}
                placeholder="e.g. treatment completed, balance returned"
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" variant="danger" size="sm" loading={busy}>
                <Undo2 size={14} /> Refund
              </ActionButton>
              <ActionButton type="button" variant="ghost" size="sm" onClick={() => setShowRefund(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : (
          <ActionButton variant="outline" size="sm" className="justify-self-start" onClick={() => setShowRefund(true)}>
            <Undo2 size={14} /> Refund remaining balance
          </ActionButton>
        )
      ) : null}
    </section>
  );
}
