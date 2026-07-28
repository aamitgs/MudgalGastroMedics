"use client";

import { CalendarClock, MessageCircle, Plus, UserRoundCheck, UserRoundX } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { getStatusToneClass, type BadgeTone } from "@/components/design-system/StatusBadge";
import { notify } from "@/lib/notify";
import type { AppointmentWaitlistEntry, AppointmentWaitlistStatus } from "@/lib/appointment-waitlist-types";

type ListResponse = { ok: boolean; entries?: AppointmentWaitlistEntry[]; error?: string };
type MutationResponse = { ok: boolean; entry?: AppointmentWaitlistEntry; error?: string };

const statusTone: Record<AppointmentWaitlistStatus, BadgeTone> = {
  Waiting: "info",
  Offered: "warning",
  Booked: "success",
  Cancelled: "inactive"
};

/**
 * When a scheduled appointment is cancelled, the server automatically offers
 * that slot to the oldest matching "Waiting" entry here (see offerWaitlistSlot
 * in appointment-waitlist-store.ts) — reception is alerted via the existing
 * notification bell and confirms the booking manually from this panel.
 */
export function AppointmentWaitlistPanel() {
  const [entries, setEntries] = useState<AppointmentWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/appointment-waitlist", { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as ListResponse;
    if (response?.ok && data.ok) setEntries(data.entries ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      service: String(data.get("service") ?? "").trim(),
      preferredDate: String(data.get("preferredDate") ?? "").trim() || undefined,
      notes: String(data.get("notes") ?? "").trim() || undefined
    };
    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch("/api/appointment-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      setSubmitting(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void addEntry(event));
      return;
    }
    const result = (await response.json().catch(() => ({}))) as MutationResponse;
    setSubmitting(false);
    if (!response.ok || !result.ok || !result.entry) {
      notify.error(result.error || "Unable to add to waitlist.");
      return;
    }
    setEntries((current) => [result.entry as AppointmentWaitlistEntry, ...current]);
    form.reset();
    notify.success("Added to waitlist");
  }

  async function setStatus(id: string, status: AppointmentWaitlistStatus) {
    let response: Response;
    try {
      response = await fetch("/api/appointment-waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void setStatus(id, status));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as MutationResponse;
    if (!response.ok || !data.ok || !data.entry) {
      notify.error(data.error || "Unable to update waitlist entry.");
      return;
    }
    setEntries((current) => current.map((item) => (item.id === id ? (data.entry as AppointmentWaitlistEntry) : item)));
    notify.success(status === "Booked" ? "Marked as booked" : "Waitlist entry updated");
  }

  const active = entries.filter((entry) => entry.status === "Waiting" || entry.status === "Offered");

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Appointment Waitlist</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Auto-offered on cancellation</h2>
        <p className="mt-1 text-sm text-muted">When a scheduled appointment is cancelled, the oldest matching entry here is automatically offered that slot — you&apos;ll get a notification to contact them.</p>
      </div>

      <form onSubmit={addEntry} className="grid grid-cols-[minmax(0,1fr)] gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="name" required placeholder="Patient name" className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
        <input name="phone" required placeholder="Phone" className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
        <input name="service" required placeholder="Service" className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
        <input name="preferredDate" type="date" placeholder="Preferred date (optional)" className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
        <ActionButton type="submit" variant="primary" loading={submitting} className="justify-center">
          <Plus size={16} /> Add to waitlist
        </ActionButton>
        <input name="notes" placeholder="Notes (optional)" className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 sm:col-span-2 lg:col-span-5" />
      </form>

      <div className="grid gap-2 p-4">
        {loading ? (
          <p className="text-sm text-muted">Loading waitlist…</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-muted">No one is waiting for a slot right now.</p>
        ) : (
          active.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/50 p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ink">{entry.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${getStatusToneClass(statusTone[entry.status])}`}>{entry.status}</span>
                </div>
                <p className="text-sm text-muted">
                  {entry.service}
                  {entry.preferredDate ? ` · ${entry.preferredDate}` : " · any date"} · {entry.phone}
                </p>
                {entry.status === "Offered" ? (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <CalendarClock size={13} /> A slot opened up — contact them to confirm.
                  </p>
                ) : null}
                {entry.notes ? <p className="mt-1 text-xs text-muted">{entry.notes}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`https://wa.me/${entry.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  className="grid h-8 w-8 place-items-center rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"
                >
                  <MessageCircle size={14} />
                </a>
                <ActionButton variant="success" size="sm" title="Mark booked" onClick={() => void setStatus(entry.id, "Booked")} className="h-8 w-8 min-h-8 px-0">
                  <UserRoundCheck size={14} />
                </ActionButton>
                <ActionButton variant="danger" size="sm" title="Remove from waitlist" onClick={() => void setStatus(entry.id, "Cancelled")} className="h-8 w-8 min-h-8 px-0">
                  <UserRoundX size={14} />
                </ActionButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
