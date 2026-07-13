"use client";

import { Archive, Bell, CheckCheck, CheckCircle2, Inbox, Megaphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import type { NotificationPriority, NotificationStatus, StaffNotification } from "@/lib/notification-types";
import { notificationCategories } from "@/lib/notification-types";

type NotificationsResponse = { ok: boolean; notifications?: StaffNotification[]; error?: string };
type AnnouncementResponse = { ok: boolean; error?: string };

const POLL_MS = 60_000;

type Filter = "Open" | "Unread" | "Critical" | "Archived";
const filters: Filter[] = ["Open", "Unread", "Critical", "Archived"];

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

function matchesFilter(notification: StaffNotification, filter: Filter) {
  switch (filter) {
    case "Open":
      return notification.status === "Unread" || notification.status === "Read";
    case "Unread":
      return notification.status === "Unread";
    case "Critical":
      return notification.priority === "Critical" && notification.status !== "Archived";
    case "Archived":
      return notification.status === "Archived" || notification.status === "Resolved";
  }
}

/**
 * Central staff notification inbox (Track 2.4): bell + tray fed by the
 * explainable operational alert rules, with the shared team lifecycle
 * (unread / read / resolved / archived) and category grouping per P4.
 */
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Open");
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDetail, setAnnouncementDetail] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<NotificationPriority>("Normal");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (!response) return;
    const data = (await response.json().catch(() => ({}))) as NotificationsResponse;
    if (!response.ok || !data.ok || !data.notifications) {
      setError(data.error || "Unable to load notifications.");
      return;
    }
    setError("");
    setNotifications(data.notifications);
  }, []);

  useEffect(() => {
    // Defer the initial fetch a tick so state updates never run synchronously
    // inside the effect body; the interval then keeps the inbox fresh.
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const refresh = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(refresh);
  }, [open, load]);

  async function act(id: string | null, action: "read" | "resolve" | "archive" | "read-all") {
    // Optimistic team-inbox update; the poll reconciles with the server.
    setNotifications((items) =>
      items.map((item) => {
        if (action === "read-all") return item.status === "Unread" ? { ...item, status: "Read" as NotificationStatus } : item;
        if (item.id !== id) return item;
        const status: NotificationStatus = action === "read" ? "Read" : action === "resolve" ? "Resolved" : "Archived";
        return { ...item, status };
      })
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "read-all" ? { action } : { id, action })
      });
    } catch {
      // Previously a silent .catch(() => null): the optimistic update stayed
      // on screen until the next poll silently reverted it, with no
      // explanation. The poll (and this retry) still reconcile the true
      // state either way — this just makes a network failure visible instead
      // of a UI action that quietly un-does itself a few seconds later.
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void act(id, action));
      return;
    }
    void load();
  }

  async function postAnnouncement() {
    setPosting(true);
    let response: Response;
    try {
      response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: announcementTitle, detail: announcementDetail, priority: announcementPriority })
      });
    } catch {
      setPosting(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void postAnnouncement());
      return;
    }
    const data = (await response.json().catch(() => ({}))) as AnnouncementResponse;
    setPosting(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to post announcement.");
      return;
    }
    notify.success("Announcement posted");
    setAnnouncementTitle("");
    setAnnouncementDetail("");
    setAnnouncementPriority("Normal");
    setComposing(false);
    void load();
  }

  const unread = notifications.filter((item) => item.status === "Unread");
  const hasCritical = unread.some((item) => item.priority === "Critical");
  const visible = useMemo(() => notifications.filter((item) => matchesFilter(item, filter)), [notifications, filter]);
  const grouped = useMemo(
    () => notificationCategories.map((category) => ({ category, items: visible.filter((item) => item.category === category) })).filter((group) => group.items.length),
    [visible]
  );

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
          <div className="grid gap-2 border-b border-line bg-soft/60 px-4 py-3">
            <input
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
              placeholder="Announcement title"
              maxLength={120}
              className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
            <textarea
              value={announcementDetail}
              onChange={(event) => setAnnouncementDetail(event.target.value)}
              placeholder="Message every staff member will see"
              maxLength={600}
              className="min-h-16 rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                aria-label="Announcement priority"
                value={announcementPriority}
                onChange={(event) => setAnnouncementPriority(event.target.value as NotificationPriority)}
                className="min-h-9 rounded border border-line bg-surface px-2 text-xs font-bold text-ink"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <ActionButton
                variant="primary"
                size="sm"
                disabled={posting || !announcementTitle.trim() || !announcementDetail.trim()}
                onClick={() => void postAnnouncement()}
              >
                {posting ? "Posting…" : "Post to all staff"}
              </ActionButton>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2" role="tablist" aria-label="Notification filters">
          {filters.map((option) => (
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
                              setOpen(false);
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
