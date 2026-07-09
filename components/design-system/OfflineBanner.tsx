"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * App-wide connectivity notice (Track 4.2) — staff always know before a save
 * might fail, rather than discovering it only when a submit errors out.
 * Deliberately just a notice: nothing here queues or auto-retries writes: a
 * clinical write should never silently replay once connectivity returns.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white">
      <WifiOff size={15} className="shrink-0" />
      You&apos;re offline. Changes won&apos;t save until your connection returns.
    </div>
  );
}
