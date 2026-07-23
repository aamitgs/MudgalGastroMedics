"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LabOrder } from "@/lib/lab-types";

type LabResponse = { ok: boolean; orders?: LabOrder[]; error?: string };

/** Compact enough to sit inline in the consultation card, not a substitute for the full Laboratory module. */
const RECENT_COUNT = 3;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function CriticalPill({ acknowledged }: { acknowledged: boolean }) {
  return acknowledged ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <AlertTriangle size={11} /> Acknowledged
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <AlertTriangle size={11} /> Critical
    </span>
  );
}

/**
 * Recent lab orders for the patient in front of the doctor, without leaving
 * the consultation. Reads /api/lab?phone=... (server-side filtered, so only
 * this one patient's history reaches the browser — same reasoning as
 * lib/lab-store.ts's listPatientLabOrders, previously unused dead code).
 * There's no structured per-test value/unit/range in this data model (see
 * lib/clinical/lab-critical.ts) — resultSummary is the free-text result, so
 * that's what's shown, same as the Laboratory module itself.
 */
export function RecentLabsStrip({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<LabOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // No reset-to-loading here: DoctorConsultationCard is remounted per
    // visit (key={selectedVisit.id} at the call site), so `orders` already
    // starts fresh at null for every patient — this effect only ever runs
    // once per mount, not on an in-place phone swap.
    let active = true;
    fetch(`/api/lab?phone=${encodeURIComponent(phone)}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((data: LabResponse) => {
        if (!active) return;
        if (!data.ok || !data.orders) {
          setError(data.error || "Unable to load recent labs.");
          return;
        }
        setOrders(data.orders);
      })
      .catch(() => {
        if (active) setError("Unable to reach the server.");
      });
    return () => {
      active = false;
    };
  }, [phone]);

  if (error) return null;
  if (orders === null) {
    return <div className="h-24 animate-pulse rounded border border-line bg-soft/70" aria-hidden="true" />;
  }

  const recent = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, RECENT_COUNT);
  if (!recent.length) return null;

  return (
    <div className="rounded border border-line bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <FlaskConical size={14} /> Recent Labs
      </p>
      <div className="mt-3 grid gap-2">
        {recent.map((order) => (
          <div key={order.id} className="rounded border border-line/70 p-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-ink">{order.tests.join(", ")}</span>
              {order.criticalFlag ? <CriticalPill acknowledged={Boolean(order.criticalAcknowledgedAt)} /> : null}
            </div>
            <p className="mt-1 text-muted">{formatDate(order.createdAt)} · {order.status}</p>
            {order.resultSummary?.trim() ? (
              <p className="mt-1 line-clamp-2 leading-relaxed text-ink">{order.resultSummary}</p>
            ) : null}
          </div>
        ))}
      </div>
      <Link href="/mudgalgastromedics-os/lab" className="mt-3 inline-block text-xs font-bold text-brand hover:underline">
        View all labs
      </Link>
    </div>
  );
}
