"use client";

import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { CashClosing, TenderCount } from "@/lib/cash-closing-types";
import { notify } from "@/lib/notify";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-right text-sm tabular-nums text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const statusTone: Record<CashClosing["status"], BadgeTone> = {
  Open: "inactive",
  Closed: "success",
  "Awaiting Approval": "warning"
};

type PreviewResponse = {
  ok: boolean;
  date?: string;
  tenders?: TenderCount[];
  refundedPaise?: number;
  discountedPaise?: number;
  netPaise?: number;
  existing?: CashClosing | null;
  error?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Daily cash closing (Track 5.10, §24).
 *
 * The expected column is derived from the ledger and read-only; the counted
 * column is the only thing typed. That separation is the entire control — a
 * close where one is copied from the other proves nothing, so the screen never
 * offers to fill the count in.
 */
export function CashClosingPanel() {
  const [date, setDate] = useState(todayIso());
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [openingCash, setOpeningCash] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    let response: Response;
    try {
      response = await fetch(`/api/billing/closing?date=${date}`, { cache: "no-store" });
    } catch {
      setError("Unable to reach the server. Check your connection and retry.");
      setLoading(false);
      return;
    }
    const data = (await response.json().catch(() => ({}))) as PreviewResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load the day's position.");
      setLoading(false);
      return;
    }
    setPreview(data);
    setCounted(
      Object.fromEntries((data.existing?.tenders ?? data.tenders ?? []).map((tender) => [tender.method, String((tender.countedPaise ?? 0) / 100)]))
    );
    setOpeningCash(String((data.existing?.openingCashPaise ?? 0) / 100));
    setNotes(data.existing?.notes ?? "");
    setLoading(false);
  }, [date]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function post(body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void post(body, successMessage));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as { ok: boolean; closing?: CashClosing; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok || !data.closing) {
      notify.error(data.error || "Unable to record that.");
      return;
    }

    if (data.closing.status === "Awaiting Approval") {
      // Direction matters: telling a supervisor the till is short when it is
      // over sends them looking for the wrong problem.
      const over = data.closing.differencePaise > 0;
      notify.warning(`Day ${over ? "over" : "short"} by ${formatPaise(Math.abs(data.closing.differencePaise))}`, {
        description: "Recorded, but it needs a supervisor's sign-off before it can close."
      });
    } else {
      notify.success(successMessage);
    }
    await load();
  }

  const tenders = preview?.existing?.tenders ?? preview?.tenders ?? [];
  const countedTotal = tenders.reduce((sum, tender) => sum + Math.round(Number(counted[tender.method] || 0) * 100), 0);
  const expectedTotal = tenders.reduce((sum, tender) => sum + tender.expectedPaise, 0);
  const difference = countedTotal - expectedTotal;
  const existing = preview?.existing ?? null;
  const locked = existing?.status === "Closed";

  return (
    <section aria-label="Daily cash closing" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Day close</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Expected comes from the ledger. Count the drawer and enter what is actually there — a discrepancy needs a supervisor, it doesn&apos;t block the close.
          </p>
        </div>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Business date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </div>

      <div className="p-4">
        {loading ? (
          <ModuleSkeleton rows={3} tiles={0} />
        ) : error ? (
          <div className="grid gap-3 rounded border border-line bg-soft/60 p-6 text-center">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <ActionButton variant="secondary" size="sm" className="mx-auto" onClick={() => void load()}>
              Retry
            </ActionButton>
          </div>
        ) : (
          <div className="grid gap-4">
            {existing ? (
              <div className="flex flex-wrap items-center gap-3 rounded border border-line bg-soft/60 p-3">
                <StatusBadge tone={statusTone[existing.status]} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  {existing.status}
                </StatusBadge>
                <p className="text-sm text-ink">
                  Closed by {existing.closedBy}
                  {existing.approvedBy ? ` · approved by ${existing.approvedBy}` : ""}
                </p>
                {existing.differencePaise !== 0 ? (
                  <p className="flex items-center gap-1.5 text-sm font-bold text-coral">
                    <AlertTriangle size={14} /> {existing.differencePaise > 0 ? "Over" : "Short"} by{" "}
                    {formatPaise(Math.abs(existing.differencePaise))}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm font-bold text-teal-dark">
                    <CheckCircle2 size={14} /> Reconciled
                  </p>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Opening cash
                <input className={fieldClass} inputMode="decimal" value={openingCash} disabled={locked} onChange={(event) => setOpeningCash(event.target.value)} />
              </label>
              <div className="rounded border border-line bg-soft/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Refunded today</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{formatPaise(preview?.refundedPaise ?? 0)}</p>
              </div>
              <div className="rounded border border-line bg-soft/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Discounts given</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{formatPaise(preview?.discountedPaise ?? 0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender</TableHead>
                    <TableHead className="text-right">Expected (ledger)</TableHead>
                    <TableHead className="text-right">Counted</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenders.map((tender) => {
                    const countedPaise = Math.round(Number(counted[tender.method] || 0) * 100);
                    const variance = countedPaise - tender.expectedPaise;
                    return (
                      <TableRow key={tender.method}>
                        <TableCell className="font-semibold text-ink">{tender.method}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted">{formatPaise(tender.expectedPaise)}</TableCell>
                        <TableCell className="text-right">
                          <input
                            aria-label={`${tender.method} counted`}
                            className={fieldClass}
                            inputMode="decimal"
                            disabled={locked}
                            value={counted[tender.method] ?? "0"}
                            onChange={(event) => setCounted((current) => ({ ...current, [tender.method]: event.target.value }))}
                          />
                        </TableCell>
                        <TableCell className={`text-right font-bold tabular-nums ${variance === 0 ? "text-muted" : "text-coral"}`}>
                          {variance === 0 ? "—" : formatPaise(variance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/60 p-3">
              <p className="text-sm text-muted">
                Expected <span className="font-bold tabular-nums text-ink">{formatPaise(expectedTotal)}</span> · counted{" "}
                <span className="font-bold tabular-nums text-ink">{formatPaise(countedTotal)}</span>
              </p>
              <p className={`text-lg font-bold tabular-nums ${difference === 0 ? "text-teal-dark" : "text-coral"}`}>
                {difference === 0 ? "Reconciled" : `${difference > 0 ? "Over" : "Short"} ${formatPaise(Math.abs(difference))}`}
              </p>
            </div>

            {!locked ? (
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Notes
                  <input
                    className="min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Anything a supervisor should know about today"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    variant="primary"
                    size="sm"
                    loading={busy}
                    onClick={() =>
                      void post(
                        {
                          action: "submit",
                          date,
                          openingCash: Number(openingCash) || 0,
                          counted: Object.fromEntries(tenders.map((tender) => [tender.method, Number(counted[tender.method] || 0)])),
                          notes
                        },
                        `${date} closed and reconciled`
                      )
                    }
                  >
                    <Lock size={14} /> Close the day
                  </ActionButton>

                  {existing?.status === "Awaiting Approval" ? (
                    <ActionButton
                      variant="success"
                      size="sm"
                      loading={busy}
                      onClick={() => void post({ action: "approve", date, note: notes }, `${date} approved and closed`)}
                    >
                      <CheckCircle2 size={14} /> Approve the discrepancy
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold text-muted">This day is closed. Reopening it isn&apos;t possible — raise an adjustment instead.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
