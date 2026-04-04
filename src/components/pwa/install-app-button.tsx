"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

const INSTALL_FLAG_STORAGE_KEY = "friends-media-installed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallAppButtonProps = {
  theme?: "dark" | "light";
};

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallAppButton({ theme = "dark" }: InstallAppButtonProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const cardClassName =
    theme === "dark"
      ? "rounded-[24px] border border-white/10 bg-white/8 px-5 py-4 text-white"
      : "rounded-[24px] border border-[var(--border)] bg-white/75 px-5 py-4 text-[var(--foreground)] shadow-sm backdrop-blur-sm";
  const mutedTextClassName = theme === "dark" ? "mt-1 text-sm text-white/70" : "mt-1 text-sm text-[var(--muted)]";
  const buttonClassName =
    theme === "dark"
      ? "flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white/8 px-5 py-4 text-left text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-70"
      : "flex w-full items-center justify-between rounded-[24px] border border-[var(--border)] bg-white/75 px-5 py-4 text-left text-[var(--foreground)] shadow-sm transition hover:border-[var(--forest)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70";
  const iconWrapClassName =
    theme === "dark"
      ? "rounded-full border border-white/15 bg-white/10 p-3"
      : "rounded-full border border-[var(--border)] bg-[rgba(33,77,66,0.08)] p-3 text-[var(--forest)]";

  useEffect(() => {
    const syncInstalledState = () => {
      const standalone = isStandaloneMode();
      const persisted = typeof window !== "undefined" ? window.localStorage.getItem(INSTALL_FLAG_STORAGE_KEY) === "true" : false;
      const nextInstalled = standalone || persisted;

      setInstalled(nextInstalled);

      if (nextInstalled && typeof window !== "undefined") {
        window.localStorage.setItem(INSTALL_FLAG_STORAGE_KEY, "true");
      }
    };

    syncInstalledState();
    setShowIosHint(isIosDevice());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALL_FLAG_STORAGE_KEY, "true");
      setInstalled(true);
      setPromptEvent(null);
    };

    const handleVisibilityOrFocus = () => {
      syncInstalledState();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("pageshow", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALL_FLAG_STORAGE_KEY, "true");
        setInstalled(true);
      }

      setPromptEvent(null);
    } finally {
      setIsInstalling(false);
    }
  };

  if (installed) {
    return (
      <div className={cardClassName}>
        <p className="text-lg font-semibold">App installed</p>
        <p className={mutedTextClassName}>Friends Media is already available from your home screen.</p>
      </div>
    );
  }

  if (showIosHint && !promptEvent) {
    return (
      <div className={cardClassName}>
        <p className="text-lg font-semibold">Install on iPhone</p>
        <p className={mutedTextClassName}>Open Safari share menu, then tap Add to Home Screen.</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      disabled={!promptEvent || isInstalling}
      className={buttonClassName}
    >
      <div>
        <p className="text-lg font-semibold">Install App</p>
        <p className={mutedTextClassName}>
          {promptEvent
            ? "Add Friends Media to your phone home screen."
            : "If you are on Android, keep this page open a moment and the install option will appear when the browser is ready."}
        </p>
      </div>
      <span className={iconWrapClassName}>
        <Download className="h-5 w-5" />
      </span>
    </button>
  );
}
