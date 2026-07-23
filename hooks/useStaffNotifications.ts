"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/lib/notify";
import type { NotificationPriority, NotificationStatus, StaffNotification } from "@/lib/notification-types";
import { notificationCategories } from "@/lib/notification-types";

type NotificationsResponse = { ok: boolean; notifications?: StaffNotification[]; error?: string };
type AnnouncementResponse = { ok: boolean; error?: string };

const POLL_MS = 60_000;

export type NotificationFilter = "Open" | "Unread" | "Critical" | "Archived";
export const notificationFilters: NotificationFilter[] = ["Open", "Unread", "Critical", "Archived"];

function matchesFilter(notification: StaffNotification, filter: NotificationFilter) {
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
 * Shared staff-notification-inbox data/actions (Track 2.4 rules, P4 lifecycle):
 * both the TopNav bell popover (NotificationCenter) and the full
 * /mudgalgastromedics-os/notifications page read from this one hook, so the
 * fetch/act/announce logic and polling exist in exactly one place.
 */
export function useStaffNotifications() {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("Open");
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
      // The optimistic update stays on screen until the next poll silently
      // reverted it, with no explanation, previously. The poll (and this
      // retry) still reconcile the true state either way — this just makes a
      // network failure visible instead of a UI action that quietly un-does
      // itself a few seconds later.
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

  return {
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
    visible,
    grouped
  };
}
