"use client";

import { ActionButton } from "@/components/design-system/ActionButton";
import type { NotificationPriority } from "@/lib/notification-types";

/**
 * Shared "announce to all staff" composer — used by both the TopNav bell
 * popover (NotificationCenter) and the full /notifications page.
 */
export function NotificationAnnouncementForm({
  title,
  setTitle,
  detail,
  setDetail,
  priority,
  setPriority,
  posting,
  onSubmit
}: {
  title: string;
  setTitle: (value: string) => void;
  detail: string;
  setDetail: (value: string) => void;
  priority: NotificationPriority;
  setPriority: (value: NotificationPriority) => void;
  posting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="grid gap-2 border-b border-line bg-soft/60 px-4 py-3">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Announcement title"
        maxLength={120}
        className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
      />
      <textarea
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="Message every staff member will see"
        maxLength={600}
        className="min-h-16 rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
      />
      <div className="flex items-center justify-between gap-2">
        <select
          aria-label="Announcement priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as NotificationPriority)}
          className="min-h-9 rounded border border-line bg-surface px-2 text-xs font-bold text-ink"
        >
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <ActionButton variant="primary" size="sm" disabled={posting || !title.trim() || !detail.trim()} onClick={onSubmit}>
          {posting ? "Posting…" : "Post to all staff"}
        </ActionButton>
      </div>
    </div>
  );
}
