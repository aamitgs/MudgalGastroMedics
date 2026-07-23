"use client";

import { Bell, CheckCheck, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notificationFilters, useStaffNotifications } from "@/hooks/useStaffNotifications";
import { NotificationAnnouncementForm } from "@/components/hospital-os/NotificationAnnouncementForm";
import { NotificationList } from "@/components/hospital-os/NotificationList";

/**
 * Central staff notification inbox (Track 2.4): bell + tray fed by the
 * explainable operational alert rules, with the shared team lifecycle
 * (unread / read / resolved / archived) and category grouping per P4. Data,
 * polling and mutations live in useStaffNotifications — the full
 * /mudgalgastromedics-os/notifications page reads from the same hook.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
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
    load,
    act,
    postAnnouncement,
    unread,
    hasCritical,
    grouped
  } = useStaffNotifications();

  useEffect(() => {
    if (!open) return;
    const refresh = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(refresh);
  }, [open, load]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread.length ? `Notifications: ${unread.length} unread${hasCritical ? ", including critical" : ""}` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded border border-line bg-surface text-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
      >
        <Bell size={17} />
        {unread.length ? (
          <span
            aria-hidden="true"
            className={`absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white ${hasCritical ? "bg-coral" : "bg-brand"}`}
          >
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(420px,92vw)] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm font-bold text-ink">Notifications</p>
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

        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2" role="tablist" aria-label="Notification filters">
          {notificationFilters.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={filter === option}
              onClick={() => setFilter(option)}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${filter === option ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted hover:border-brand hover:text-brand"}`}
            >
              {option}
              {option === "Unread" && unread.length ? ` (${unread.length})` : ""}
            </button>
          ))}
        </div>

        <div className="max-h-[min(60vh,480px)] overflow-y-auto">
          <NotificationList error={error} filter={filter} grouped={grouped} act={act} onItemClick={() => setOpen(false)} />
        </div>

        <div className="border-t border-line px-4 py-2.5 text-center">
          <Link
            href="/mudgalgastromedics-os/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-bold text-brand hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
