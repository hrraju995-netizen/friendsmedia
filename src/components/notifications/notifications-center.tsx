"use client";

import { Bell } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

type PushConfigResponse = {
  enabled: boolean;
  publicKey: string;
};

type LiveAlert = NotificationItem;

type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function NotificationsCenter() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [pushSupported, setPushSupported] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hydratedRef = useRef(false);
  const announcedIdsRef = useRef<Set<string>>(new Set());
  const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const pushEndpointRef = useRef<string | null>(null);
  const publicKeyRef = useRef("");
  const alertTimeoutsRef = useRef<Map<string, number>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const removeLiveAlert = useCallback((id: string) => {
    const timeoutId = alertTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      alertTimeoutsRef.current.delete(id);
    }

    setLiveAlerts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showLiveAlerts = useCallback(
    (notifications: NotificationItem[]) => {
      if (typeof window === "undefined" || notifications.length === 0) {
        return;
      }

      const nextAlerts = [...notifications].reverse();

      setLiveAlerts((current) => {
        const merged = [...nextAlerts, ...current.filter((item) => !nextAlerts.some((next) => next.id === item.id))];
        return merged.slice(0, 4);
      });

      nextAlerts.forEach((notification) => {
        const existingTimeout = alertTimeoutsRef.current.get(notification.id);
        if (existingTimeout) {
          window.clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
          alertTimeoutsRef.current.delete(notification.id);
          setLiveAlerts((current) => current.filter((item) => item.id !== notification.id));
        }, 5000);

        alertTimeoutsRef.current.set(notification.id, timeoutId);
      });
    },
    [],
  );

  const playNotificationSound = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const audioWindow = window as AudioContextWindow;
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    try {
      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      const scheduleTone = (startAt: number, frequency: number, duration: number) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + 0.02);
      };

      const startAt = context.currentTime + 0.02;
      scheduleTone(startAt, 880, 0.14);
      scheduleTone(startAt + 0.18, 660, 0.18);
    } catch {
      return;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
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

      if (newItems.length > 0 && typeof document !== "undefined" && document.visibilityState === "visible") {
        showLiveAlerts(newItems);
        void playNotificationSound();
      }

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
  }, [permission, playNotificationSound, showLiveAlerts, status]);

  const markAllAsRead = useCallback(async () => {
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
  }, [items, unreadCount]);

  const loadPushState = useCallback(async () => {
    if (status !== "authenticated") {
      return;
    }

    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushSupported(false);
      return;
    }

    setPushSupported(true);

    try {
      const [configResponse, registration] = await Promise.all([
        fetch("/api/push", {
          method: "GET",
          cache: "no-store",
        }),
        navigator.serviceWorker.ready,
      ]);

      serviceWorkerRegistrationRef.current = registration;

      if (!configResponse.ok) {
        setPushConfigured(false);
        return;
      }

      const config = (await configResponse.json()) as PushConfigResponse;
      publicKeyRef.current = config.publicKey || "";
      setPushConfigured(Boolean(config.enabled && config.publicKey));

      const subscription = await registration.pushManager.getSubscription();
      pushEndpointRef.current = subscription?.endpoint ?? null;
      setPushEnabled(Boolean(subscription));

      if (subscription && config.enabled && config.publicKey) {
        await fetch("/api/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription.toJSON()),
        }).catch(() => undefined);
      }
    } catch {
      setPushEnabled(false);
    }
  }, [status]);

  const enablePushAlerts = useCallback(async () => {
    if (!pushSupported) {
      setPushError("This browser or device does not support push notifications.");
      return;
    }

    setPushBusy(true);
    setPushError("");

    try {
      let nextPermission: NotificationPermission = permission === "unsupported" ? "default" : permission;

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
      }

      if (nextPermission !== "granted") {
        setPushError("Notification permission was not granted on this device.");
        return;
      }

      const registration = serviceWorkerRegistrationRef.current ?? (await navigator.serviceWorker.ready);
      serviceWorkerRegistrationRef.current = registration;

      if (!publicKeyRef.current) {
        const configResponse = await fetch("/api/push", {
          method: "GET",
          cache: "no-store",
        });

        if (!configResponse.ok) {
          throw new Error("Could not load push notification settings.");
        }

        const config = (await configResponse.json()) as PushConfigResponse;
        publicKeyRef.current = config.publicKey || "";
        setPushConfigured(Boolean(config.enabled && config.publicKey));
      }

      if (!publicKeyRef.current) {
        throw new Error("Server push keys are not configured yet.");
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKeyRef.current),
        }));

      const response = await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Could not enable push alerts.");
      }

      pushEndpointRef.current = subscription.endpoint;
      setPushEnabled(true);
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Could not enable phone alerts.");
    } finally {
      setPushBusy(false);
    }
  }, [permission, pushSupported]);

  const disablePushAlerts = useCallback(async () => {
    setPushBusy(true);
    setPushError("");

    try {
      const registration = serviceWorkerRegistrationRef.current ?? (await navigator.serviceWorker.ready);
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint ?? pushEndpointRef.current;

      if (subscription) {
        await subscription.unsubscribe().catch(() => undefined);
      }

      if (endpoint) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        }).catch(() => undefined);
      }

      pushEndpointRef.current = null;
      setPushEnabled(false);
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Could not disable phone alerts.");
    } finally {
      setPushBusy(false);
    }
  }, []);

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
    }, 3000);

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
    if (status === "authenticated") {
      void loadPushState();
    }
  }, [loadPushState, status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePanelPosition = () => {
      if (typeof window === "undefined" || !buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const viewportPadding = 16;
      const mobile = window.innerWidth < 640;

      if (mobile) {
        setPanelStyle({
          top: Math.max(rect.bottom + 12, 88),
          left: viewportPadding,
          right: viewportPadding,
          width: "auto",
          maxHeight: `calc(100dvh - ${Math.max(rect.bottom + 28, 104)}px)`,
        });
        return;
      }

      const panelWidth = Math.min(368, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, rect.right - panelWidth),
        window.innerWidth - panelWidth - viewportPadding,
      );

      setPanelStyle({
        top: rect.bottom + 12,
        left,
        width: panelWidth,
        maxHeight: `calc(100dvh - ${rect.bottom + 28}px)`,
      });
    };

    updatePanelPosition();

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleViewportChange = () => {
      updatePanelPosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      void markAllAsRead();
    }
  }, [markAllAsRead, open]);

  useEffect(() => {
    const alertTimeouts = alertTimeoutsRef.current;

    return () => {
      alertTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      alertTimeouts.clear();

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
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

      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="fixed z-[200] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.98)] shadow-[0_24px_60px_rgba(28,39,35,0.18)] backdrop-blur-xl"
          >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Notifications</p>
                <p className="text-sm text-[var(--muted)]">New uploads appear here. Phone alerts use your browser or PWA default sound.</p>
              </div>
              {pushSupported ? (
                pushEnabled ? (
                  <button
                    type="button"
                    onClick={() => void disablePushAlerts()}
                    disabled={pushBusy}
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--forest)] hover:text-[var(--forest)] disabled:opacity-60"
                  >
                    {pushBusy ? "Working..." : "Mute phone"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void enablePushAlerts()}
                    disabled={pushBusy}
                    className="rounded-full bg-[var(--forest)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-92 disabled:opacity-60"
                  >
                    {pushBusy ? "Working..." : "Enable phone alerts"}
                  </button>
                )
              ) : null}
            </div>

            {!pushSupported ? (
              <p className="mt-2 text-xs text-[var(--muted)]">This browser does not support phone push notifications.</p>
            ) : !pushConfigured ? (
              <p className="mt-2 text-xs text-[var(--muted)]">Phone push is not configured on the server yet.</p>
            ) : pushEnabled ? (
              <p className="mt-2 text-xs text-[var(--forest)]">Phone alerts are active on this device.</p>
            ) : permission === "denied" ? (
              <p className="mt-2 text-xs text-red-700">Notification permission is blocked in this browser. Enable it from browser settings.</p>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">Enable phone alerts to see upload notifications on your device screen.</p>
            )}

            {pushError ? <p className="mt-2 text-xs text-red-700">{pushError}</p> : null}
          </div>

          <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: "min(24rem, calc(100dvh - 8rem))" }}>
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
          </div>,
          document.body,
        )
        : null}

      {liveAlerts.length > 0 && typeof document !== "undefined"
        ? createPortal(
          <div className="pointer-events-none fixed top-20 right-4 z-[220] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:top-24">
            {liveAlerts.map((item) => (
              <div
                key={item.id}
                className="pointer-events-auto rounded-[24px] border border-[rgba(33,77,66,0.18)] bg-[rgba(255,252,247,0.98)] px-4 py-3 shadow-[0_18px_40px_rgba(28,39,35,0.18)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.message}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{formatNotificationDate(item.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLiveAlert(item.id)}
                    className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}
