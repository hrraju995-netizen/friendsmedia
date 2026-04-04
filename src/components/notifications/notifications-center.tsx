"use client";

import { Bell } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationsCenter() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hydratedRef = useRef(false);
  const announcedIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useEffectEvent(async () => {
    if (status !== "authenticated") {
      return;
    }

    try {
      const response = await fetch("/api/notifications?limit=8", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as NotificationsResponse;
      setItems(payload.notifications);
      setUnreadCount(payload.unreadCount);

      if (!hydratedRef.current) {
        payload.notifications.forEach((notification) => {
          announcedIdsRef.current.add(notification.id);
        });
        hydratedRef.current = true;
        return;
      }

      const newItems = payload.notifications.filter((notification) => !announcedIdsRef.current.has(notification.id));
      newItems.forEach((notification) => {
        announcedIdsRef.current.add(notification.id);
      });

      if (
        newItems.length > 0 &&
        permission === "granted" &&
        typeof window !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        [...newItems].reverse().forEach((notification) => {
          new Notification(notification.title, {
            body: notification.message,
            tag: notification.id,
          });
        });
      }
    } finally {
      setLoading(false);
    }
  });

  const markAllAsRead = useEffectEvent(async () => {
    if (unreadCount === 0) {
      return;
    }

    const unreadIds = items.filter((item) => !item.isRead).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));

    await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: unreadIds }),
    }).catch(() => undefined);
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    };

    const handleRefreshRequest = () => {
      void fetchNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("friends-media:refresh-notifications", handleRefreshRequest);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("friends-media:refresh-notifications", handleRefreshRequest);
    };
  }, [fetchNotifications, status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      void markAllAsRead();
    }
  }, [markAllAsRead, open]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/60 px-3 py-2 text-xs transition hover:border-[var(--forest)] hover:text-[var(--forest)] sm:px-4 sm:text-sm"
      >
        <Bell className="h-4 w-4" />
        <span>Notifications</span>
        {unreadCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[min(92vw,23rem)] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(28,39,35,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Notifications</p>
              <p className="text-sm text-[var(--muted)]">New uploads appear here for everyone in the group.</p>
            </div>
            {permission === "default" ? (
              <button
                type="button"
                onClick={async () => {
                  const nextPermission = await Notification.requestPermission();
                  setPermission(nextPermission);
                }}
                className="rounded-full bg-[var(--forest)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-92"
              >
                Enable alerts
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto px-3 py-3">
            {loading ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--muted)]">
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--muted)]">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const content = (
                    <div
                      className={`rounded-[20px] border px-4 py-3 transition ${
                        item.isRead
                          ? "border-[var(--border)] bg-white/72"
                          : "border-[rgba(33,77,66,0.16)] bg-[rgba(33,77,66,0.08)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.message}</p>
                        </div>
                        {!item.isRead ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" /> : null}
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">{formatNotificationDate(item.createdAt)}</p>
                    </div>
                  );

                  return item.link ? (
                    <Link key={item.id} href={item.link as Route} onClick={() => setOpen(false)} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
