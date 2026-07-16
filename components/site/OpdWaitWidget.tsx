"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

type OpdStatus = {
  isOpen: boolean;
  queueLength: number;
  avgWaitMinutes: number | null;
};

const pollMs = 60_000;

/** Coarse, honest live queue signal on the public booking CTA — never fabricates a number where there's no real data (e.g. before the first patient of the day). */
export function OpdWaitWidget({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<OpdStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/public/opd-status", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data.ok) {
          setStatus({ isOpen: data.isOpen, queueLength: data.queueLength, avgWaitMinutes: data.avgWaitMinutes });
        }
      } catch {
        // Non-critical widget — fail silently rather than showing an alarming error on a public marketing page.
      }
    }

    void load();
    const interval = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!status) return null;

  const label = !status.isOpen
    ? "OPD is currently closed — see today's hours"
    : status.avgWaitMinutes === null
      ? "OPD is open — no wait reported right now"
      : `~${status.avgWaitMinutes} min typical wait today${status.queueLength ? ` · ${status.queueLength} patient${status.queueLength === 1 ? "" : "s"} in queue` : ""}`;

  return (
    <p className={`inline-flex items-center gap-2 text-sm font-semibold text-white/90 ${className}`}>
      <Clock3 size={15} className={status.isOpen ? "text-teal-300" : "text-white/60"} />
      {label}
    </p>
  );
}
