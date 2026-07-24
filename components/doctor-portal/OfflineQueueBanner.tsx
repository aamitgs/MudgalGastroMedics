"use client";

import { CloudUpload } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { listQueuedSaves, subscribeToQueueChanges, type QueuedSave } from "@/lib/offline-save-queue";

/**
 * Visible, doctor-actioned counterpart to the write-queueing added to
 * updateVisit (Track: offline sync) — deliberately requires a "Sync Now"
 * click rather than replaying automatically on reconnect, per
 * OfflineBanner's own documented reasoning for why a clinical write should
 * never silently resend itself.
 */
export function OfflineQueueBanner({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  const [queued, setQueued] = useState<QueuedSave[]>([]);
  const online = useOnlineStatus();

  useEffect(() => {
    const initial = window.setTimeout(() => setQueued(listQueuedSaves()), 0);
    const unsubscribe = subscribeToQueueChanges(() => setQueued(listQueuedSaves()));
    return () => {
      window.clearTimeout(initial);
      unsubscribe();
    };
  }, []);

  if (!queued.length) return null;

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-900 dark:bg-amber-950">
      <span className="font-semibold text-amber-900 dark:text-amber-200">
        {queued.length} change{queued.length === 1 ? "" : "s"} saved locally while offline
        {online ? " — ready to sync." : ", waiting for your connection to return."}
      </span>
      {online ? (
        <ActionButton variant="warning" size="sm" onClick={onSync} loading={syncing}>
          <CloudUpload size={14} /> Sync Now
        </ActionButton>
      ) : null}
    </div>
  );
}
