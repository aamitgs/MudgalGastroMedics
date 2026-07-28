"use client";

import { CalendarClock, FileSignature, PackageCheck } from "lucide-react";
import { useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { AcceptanceMethod, Estimate, EstimateStatus } from "@/lib/estimate-types";
import { acceptanceMethods } from "@/lib/estimate-types";
import type { PackageBalance } from "@/lib/package-calc";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormField } from "@/components/design-system/FormField";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const estimateTone: Record<EstimateStatus, BadgeTone> = {
  Draft: "inactive",
  Shared: "info",
  Accepted: "success",
  Declined: "critical",
  Converted: "success",
  Expired: "warning"
};

type QueuedEstimate = Estimate & { effectiveStatus: EstimateStatus };

type Props = {
  balances: PackageBalance[];
  estimates: QueuedEstimate[];
  busy?: boolean;
  onShare: (estimate: QueuedEstimate) => Promise<void>;
  onAccept: (estimate: QueuedEstimate, signatureName: string, method: AcceptanceMethod) => Promise<void>;
  onConvert: (estimate: QueuedEstimate) => Promise<void>;
};

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Package balances and estimates for one patient (Track 5.7).
 *
 * The package balance answers the question a patient actually asks at the
 * counter — "how many do I have left?" — with the used/remaining split
 * spelled out rather than a total they have to work out themselves.
 */
export function PackageEstimatePanel({ balances, estimates, busy, onShare, onAccept, onConvert }: Props) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [method, setMethod] = useState<AcceptanceMethod>("In person");

  async function submitAcceptance(estimate: QueuedEstimate) {
    if (!signatureName.trim()) return;
    await onAccept(estimate, signatureName, method);
    setSignatureName("");
    setAcceptingId(null);
  }

  return (
    <div className="grid gap-4">
      {balances.length ? (
        <section aria-label="Package balance" className="rounded border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
            <PackageCheck size={13} /> Package balance
          </p>
          <ul className="mt-2 grid gap-2">
            {balances.map((balance) => (
              <li key={balance.purchaseId} className="rounded border border-line px-3 py-2">
                <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-ink">
                  {balance.packageName}
                  {balance.expired ? (
                    <StatusBadge tone="warning" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      Expired
                    </StatusBadge>
                  ) : balance.expiresAt ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                      <CalendarClock size={12} /> valid to {dateLabel(balance.expiresAt)}
                    </span>
                  ) : null}
                </p>
                <ul className="mt-1.5 grid gap-1">
                  {balance.lines.map((entry) => (
                    <li key={entry.priceCode} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="text-ink">{entry.name}</span>
                      <span className="tabular-nums text-muted">
                        used {entry.used} of {entry.included} ·{" "}
                        <span className={`font-bold ${entry.remaining > 0 && !balance.expired ? "text-teal-dark" : "text-muted"}`}>
                          {entry.remaining} remaining
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {estimates.length ? (
        <section aria-label="Estimates" className="rounded border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
            <FileSignature size={13} /> Estimates
          </p>
          <ul className="mt-2 grid gap-2">
            {estimates.map((estimate) => (
              <li key={estimate.id} className="grid gap-2 rounded border border-line px-3 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-ink">
                      <span className="font-mono text-xs">{estimate.estimateNo}</span>
                      <StatusBadge tone={estimateTone[estimate.effectiveStatus]} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {estimate.effectiveStatus}
                      </StatusBadge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {dateLabel(estimate.createdAt)}
                      {estimate.validUntil ? ` · valid to ${dateLabel(estimate.validUntil)}` : ""}
                      {estimate.convertedInvoiceNo ? ` · billed as ${estimate.convertedInvoiceNo}` : ""}
                    </p>
                  </div>
                  <p className="font-bold tabular-nums text-ink">{formatPaise(estimate.totalPaise)}</p>
                </div>

                {estimate.patientSignatureName ? (
                  <p className="text-xs text-muted">
                    Accepted by {estimate.patientSignatureName} ({estimate.acceptanceMethod}) · recorded by {estimate.acceptedBy}
                  </p>
                ) : null}

                {acceptingId === estimate.id ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitAcceptance(estimate);
                    }}
                    className="grid gap-2 border-t border-line pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]"
                  >
                    <FormField label="Patient's name, as given" htmlFor={`sig-${estimate.id}`} required>
                      <input
                        id={`sig-${estimate.id}`}
                        className={fieldClass}
                        value={signatureName}
                        onChange={(event) => setSignatureName(event.target.value)}
                      />
                    </FormField>
                    <FormField label="Taken" htmlFor={`method-${estimate.id}`} required>
                      <select
                        id={`method-${estimate.id}`}
                        className={fieldClass}
                        value={method}
                        onChange={(event) => setMethod(event.target.value as AcceptanceMethod)}
                      >
                        {acceptanceMethods.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <div className="flex items-end gap-2">
                      <ActionButton type="submit" variant="success" size="sm" loading={busy}>
                        Record acceptance
                      </ActionButton>
                      <ActionButton type="button" variant="ghost" size="sm" onClick={() => setAcceptingId(null)}>
                        Cancel
                      </ActionButton>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {estimate.effectiveStatus === "Draft" ? (
                      <ActionButton variant="secondary" size="sm" loading={busy} onClick={() => void onShare(estimate)}>
                        Mark shared with patient
                      </ActionButton>
                    ) : null}
                    {estimate.effectiveStatus === "Shared" || estimate.effectiveStatus === "Expired" ? (
                      <ActionButton variant="secondary" size="sm" onClick={() => setAcceptingId(estimate.id)}>
                        Record patient acceptance
                      </ActionButton>
                    ) : null}
                    {estimate.effectiveStatus === "Accepted" ? (
                      <ActionButton variant="primary" size="sm" loading={busy} onClick={() => void onConvert(estimate)}>
                        Convert to bill
                      </ActionButton>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
