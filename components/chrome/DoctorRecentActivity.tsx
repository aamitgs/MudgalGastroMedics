"use client";

import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";

type ActivityEvent = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string;
};

type ActivityResponse = { ok: boolean; events?: ActivityEvent[]; error?: string };

/** A doctor's own recent actions — self-scoped, not the hospital-wide audit log (see app/api/doctor/activity/route.ts). */
export function DoctorRecentActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/doctor/activity", { cache: "no-store" }).catch(() => null);
      const data = (await response?.json().catch(() => ({}))) as ActivityResponse;
      if (!active) return;
      setLoading(false);
      if (response?.ok && data.ok && data.events) setEvents(data.events);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="rounded border border-line/80 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-line p-4">
        <History size={17} className="text-brand" />
        <h2 className="text-sm font-bold text-ink">Recent activity</h2>
      </div>
      <div className="grid max-h-72 gap-2 overflow-auto p-4">
        {!loading && events.length === 0 ? (
          <ModuleEmptyState
            icon={History}
            title="No recent activity yet"
            description="Consultations, prescriptions and other actions you take will appear here."
          />
        ) : null}
        {events.map((event) => (
          <div key={event.id} className="flex items-baseline justify-between gap-3 rounded border border-line/60 bg-soft/40 px-3 py-2">
            <p className="truncate text-xs font-semibold text-ink">{event.action}</p>
            <time className="shrink-0 text-[11px] font-medium text-muted" dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
