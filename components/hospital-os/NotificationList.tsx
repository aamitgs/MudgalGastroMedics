"use client";

import { Archive, CheckCircle2, Inbox } from "lucide-react";
import type { NotificationFilter } from "@/hooks/useStaffNotifications";
import type { NotificationCategory, StaffNotification } from "@/lib/notification-types";

const priorityDot: Record<StaffNotification["priority"], string> = {
  Critical: "bg-coral",
  High: "bg-gold",
  Normal: "bg-teal"
};

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Shared grouped-notification list markup — used by both the TopNav bell
 * popover (NotificationCenter) and the full /notifications page, so the
 * item/empty/error rendering exists in exactly one place.
 */
export function NotificationList({
  error,
  filter,
  grouped,
  act,
  onItemClick
}: {
  error: string;
  filter: NotificationFilter;
  grouped: { category: NotificationCategory; items: StaffNotification[] }[];
  act: (id: string | null, action: "read" | "resolve" | "archive" | "read-all") => void;
  /** Popover closes itself after a click; the full page has nothing to close. */
  onItemClick?: () => void;
}) {
  return (
    <>
      {error ? <p className="px-4 py-3 text-sm font-semibold text-coral">{error}</p> : null}
      {!error && !grouped.length ? (
        <div className="grid place-items-center gap-2 px-6 py-10 text-center">
          <Inbox size={26} className="text-muted" />
          <p className="text-sm font-bold text-ink">
            {filter === "Open" ? "All clear" : `Nothing in ${filter.toLowerCase()}`}
          </p>
          <p className="text-xs leading-5 text-muted">
            Operational alerts — low or expiring stock, urgent requests, HDU escalations, long waits — appear here the moment a rule fires.
          </p>
        </div>
      ) : null}
      {grouped.map(({ category, items }) => (
        <div key={category} role="group" aria-label={category}>
          <p className="sticky top-0 border-b border-line bg-soft px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
            {category}
          </p>
          <ul>
            {items.map((notification) => (
              <li key={notification.id} className="border-b border-line/60 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[notification.priority]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <a
                        href={notification.href || "#"}
                        onClick={() => {
                          if (notification.status === "Unread") void act(notification.id, "read");
                          onItemClick?.();
                        }}
                        className={`truncate text-sm ${notification.status === "Unread" ? "font-bold text-ink" : "font-semibold text-muted"} hover:text-brand`}
                      >
                        {notification.title}
                      </a>
                      <span className="shrink-0 text-[11px] font-semibold text-muted">{relativeTime(notification.updatedAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{notification.detail}</p>
                    {notification.status === "Unread" || notification.status === "Read" ? (
                      <div className="mt-1.5 flex gap-3">
                        <button type="button" onClick={() => void act(notification.id, "resolve")} className="inline-flex items-center gap-1 text-[11px] font-bold text-muted transition hover:text-teal">
                          <CheckCircle2 size={12} /> Resolve
                        </button>
                        <button type="button" onClick={() => void act(notification.id, "archive")} className="inline-flex items-center gap-1 text-[11px] font-bold text-muted transition hover:text-brand">
                          <Archive size={12} /> Archive
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted/80">{notification.status}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
