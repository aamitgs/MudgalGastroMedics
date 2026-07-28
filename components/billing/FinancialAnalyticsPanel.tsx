"use client";

import { Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { CollectionTotals, DailyPoint, DiscountEntry, DoctorEarning, Forecast, RefundEntry, RevenueBreakdown } from "@/lib/billing-analytics";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AnalyticsResponse = {
  ok: boolean;
  range?: { from: string; to: string };
  today?: CollectionTotals;
  period?: CollectionTotals;
  outstanding?: { outstandingPaise: number; invoiceCount: number; patientCount: number };
  byDoctor?: RevenueBreakdown[];
  byDepartment?: RevenueBreakdown[];
  byCategory?: RevenueBreakdown[];
  topServices?: Array<{ description: string; quantity: number; billedPaise: number }>;
  trend?: DailyPoint[];
  discounts?: DiscountEntry[];
  refunds?: RefundEntry[];
  doctorEarnings?: DoctorEarning[];
  forecast?: Forecast;
  insurance?: { claimCount: number; requestedPaise: number; approvedPaise: number; settledPaise: number; pendingCount: number };
  error?: string;
};

const monthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

function BreakdownTable({ title, rows, csvName }: { title: string; rows: RevenueBreakdown[]; csvName: string }) {
  if (!rows.length) return null;
  return (
    <section aria-label={title} className="rounded border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{title}</p>
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadCsv(
              ["Name", "Billed", "Collected", "Invoices"],
              rows.map((row) => [row.key, formatPaise(row.billedPaise), formatPaise(row.collectedPaise), String(row.invoiceCount)]),
              csvName
            )
          }
        >
          <Download size={13} /> CSV
        </ActionButton>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Billed</TableHead>
            <TableHead className="text-right">Collected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 8).map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-semibold text-ink">{row.key}</TableCell>
              <TableCell className="text-right tabular-nums text-ink">{formatPaise(row.billedPaise)}</TableCell>
              <TableCell className="text-right tabular-nums text-teal-dark">{formatPaise(row.collectedPaise)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

/**
 * The financial dashboard (Track 5.10, §25/§30).
 *
 * Billed and collected are shown side by side everywhere rather than merged
 * into one "revenue" figure: they are different numbers, and a report that
 * conflates them is how a hospital ends up disagreeing with its own bank.
 */
export function FinancialAnalyticsPanel() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    let response: Response;
    try {
      response = await fetch(`/api/billing/analytics?from=${from}&to=${to}`, { cache: "no-store" });
    } catch {
      setError("Unable to reach the server. Check your connection and retry.");
      setLoading(false);
      return;
    }
    const body = (await response.json().catch(() => ({}))) as AnalyticsResponse;
    if (!response.ok || !body.ok) {
      setError(body.error || "Unable to load financial analytics.");
      setLoading(false);
      return;
    }
    setData(body);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const tiles = [
    { label: "Collected Today", value: formatPaise(data?.today?.netPaise ?? 0) },
    { label: "Collected in Period", value: formatPaise(data?.period?.netPaise ?? 0) },
    { label: "Outstanding", value: formatPaise(data?.outstanding?.outstandingPaise ?? 0) },
    { label: "Projected Month End", value: formatPaise(data?.forecast?.projectedMonthEndPaise ?? 0) }
  ];

  return (
    <section aria-label="Financial analytics" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Financial analytics</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Billed and collected shown separately throughout — they are different numbers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            From
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            To
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </label>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <ModuleSkeleton rows={4} tiles={4} />
        ) : error ? (
          <div className="grid gap-3 rounded border border-line bg-soft/60 p-6 text-center">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <ActionButton variant="secondary" size="sm" className="mx-auto" onClick={() => void load()}>
              Retry
            </ActionButton>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {tiles.map((tile) => (
                <div key={tile.label} className="rounded border border-line bg-soft/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{tile.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{tile.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-line bg-surface p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Cash vs digital</p>
                <div className="mt-2 grid gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Cash</span>
                    <span className="font-bold tabular-nums text-ink">{formatPaise(data?.period?.cashPaise ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Digital</span>
                    <span className="font-bold tabular-nums text-ink">{formatPaise(data?.period?.digitalPaise ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5">
                    <span className="text-muted">Refunded</span>
                    <span className="font-bold tabular-nums text-coral">−{formatPaise(data?.period?.refundedPaise ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded border border-line bg-surface p-4">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
                  <TrendingUp size={13} /> Forecast
                </p>
                <p className="mt-2 text-sm text-ink">
                  {formatPaise(data?.forecast?.dailyAveragePaise ?? 0)} a day across {data?.forecast?.daysElapsed ?? 0} of{" "}
                  {data?.forecast?.daysInMonth ?? 0} days.
                </p>
                {/* Said plainly, so nobody mistakes a straight line for a model. */}
                <p className="mt-1 text-xs text-muted">Straight-line projection from this month&apos;s daily average. No seasonality is applied.</p>
              </div>
            </div>

            <BreakdownTable title="Revenue by doctor" rows={data?.byDoctor ?? []} csvName="revenue-by-doctor.csv" />
            <BreakdownTable title="Revenue by department" rows={data?.byDepartment ?? []} csvName="revenue-by-department.csv" />
            <BreakdownTable title="Revenue by category" rows={data?.byCategory ?? []} csvName="revenue-by-category.csv" />

            {data?.doctorEarnings?.length ? (
              <section aria-label="Doctor earnings" className="rounded border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Doctor earnings</p>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        ["Doctor", "Billed", "Collected", "Incentive %", "Incentive"],
                        (data.doctorEarnings ?? []).map((row) => [
                          row.doctor,
                          formatPaise(row.billedPaise),
                          formatPaise(row.collectedPaise),
                          `${row.incentivePercent}%`,
                          formatPaise(row.incentivePaise)
                        ]),
                        "doctor-earnings.csv"
                      )
                    }
                  >
                    <Download size={13} /> CSV
                  </ActionButton>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Incentive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.doctorEarnings.map((row) => (
                      <TableRow key={row.doctor}>
                        <TableCell className="font-semibold text-ink">{row.doctor}</TableCell>
                        <TableCell className="text-right tabular-nums text-ink">{formatPaise(row.collectedPaise)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted">{row.incentivePercent}%</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-teal-dark">{formatPaise(row.incentivePaise)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="mt-2 text-xs text-muted">Calculated on collected revenue, not billed. Rates are set by Accounts.</p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
