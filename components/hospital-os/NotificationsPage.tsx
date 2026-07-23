"use client";

import { CheckCheck, Megaphone } from "lucide-react";
import { notificationFilters, useStaffNotifications } from "@/hooks/useStaffNotifications";
import { NotificationAnnouncementForm } from "@/components/hospital-os/NotificationAnnouncementForm";
import { NotificationList } from "@/components/hospital-os/NotificationList";

/**
 * Full-page staff notification inbox — the same data/actions the TopNav bell
 * popover (NotificationCenter) uses, via the shared useStaffNotifications
 * hook, laid out as a full list instead of a constrained popover tray.
 */
export function NotificationsPage() {
  const {
    filter,
    setFilter,
    error,
    composing,
    setComposing,
    announcementTitle,
    setAnnouncementTitle,
    announcementDetail,
    setAnnouncementDetail,
    announcementPriority,
    setAnnouncementPriority,
    posting,
    act,
    postAnnouncement,
    unread,
    grouped
  } = useStaffNotifications();

  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Notification filters">
          {notificationFilters.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={filter === option}
              onClick={() => setFilter(option)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${filter === option ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted hover:border-brand hover:text-brand"}`}
            >
              {option}
              {option === "Unread" && unread.length ? ` (${unread.length})` : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setComposing((current) => !current)}
            aria-expanded={composing}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted transition hover:text-brand"
          >
            <Megaphone size={13} /> Announce
          </button>
          <button
            type="button"
            onClick={() => void act(null, "read-all")}
            disabled={!unread.length}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        </div>
      </div>

      {composing ? (
        <NotificationAnnouncementForm
          title={announcementTitle}
          setTitle={setAnnouncementTitle}
          detail={announcementDetail}
          setDetail={setAnnouncementDetail}
          priority={announcementPriority}
          setPriority={setAnnouncementPriority}
          posting={posting}
          onSubmit={() => void postAnnouncement()}
        />
      ) : null}

      <div>
        <NotificationList error={error} filter={filter} grouped={grouped} act={act} />
      </div>
    </div>
  );
}
