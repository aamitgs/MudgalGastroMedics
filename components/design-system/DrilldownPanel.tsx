"use client";

import { Download, Loader2, X } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { downloadCsv } from "@/lib/table-export";
import { notify } from "@/lib/notify";

type DrilldownResponse = {
  ok: boolean;
  title?: string;
  headers?: string[];
  rows?: string[][];
  error?: string;
};

type DrilldownPanelProps = {
  /** Report/analytics metric key understood by app/api/reports/drilldown (lib/report-drilldown.ts). */
  metric: string;
  range?: { from: string; to: string };
  /** Clickable trigger — a tile, row, or label. Rendered as a button. */
  children: React.ReactNode;
  className?: string;
};

/**
 * Click-to-expand drill-down (Track 3.5): fetches the raw records behind a
 * report/analytics metric and shows them inline as a plain table, with a CSV
 * export — self-contained, so adding a new drillable tile never requires
 * wiring filters into whatever module normally owns that data.
 */
export function DrilldownPanel({ metric, range, children, className }: DrilldownPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ title: string; headers: string[]; rows: string[][] } | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (data) return;
    setLoading(true);
    const params = new URLSearchParams({ metric });
    if (range) {
      params.set("from", range.from);
      params.set("to", range.to);
    }
    const response = await fetch(`/api/reports/drilldown?${params.toString()}`, { cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as DrilldownResponse;
    setLoading(false);
    if (!response.ok || !result.ok || !result.headers || !result.rows) {
      notify.error(result.error || "Unable to load detail.");
      setOpen(false);
      return;
    }
    setData({ title: result.title || "Detail", headers: result.headers, rows: result.rows });
  }

  return (
    <div className={className}>
      <button type="button" onClick={() => void toggle()} className="block w-full text-left">
        {children}
      </button>
      {open ? (
        <div className="mt-2 rounded border border-line bg-surface p-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Loader2 size={14} className="animate-spin" /> Loading detail…
            </p>
          ) : data ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{data.title}</p>
                <div className="flex items-center gap-2">
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    disabled={data.rows.length === 0}
                    onClick={() => downloadCsv(data.headers, data.rows, `${metric}.csv`)}
                  >
                    <Download size={13} /> Export
                  </ActionButton>
                  <ActionButton variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close detail">
                    <X size={13} />
                  </ActionButton>
                </div>
              </div>
              {data.rows.length === 0 ? (
                <p className="rounded border border-line bg-soft/60 p-3 text-sm font-semibold text-muted">No matching records.</p>
              ) : (
                <div className="max-h-64 overflow-auto rounded border border-line">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-soft">
                      <tr>
                        {data.headers.map((header) => (
                          <th key={header} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, index) => (
                        <tr key={index} className="border-t border-line">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-ink">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
