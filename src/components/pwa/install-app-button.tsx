"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
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

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode());
    setShowIosHint(isIosDevice());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
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
        setInstalled(true);
      }

      setPromptEvent(null);
    } finally {
      setIsInstalling(false);
    }
  };

  if (installed) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
        <p className="text-lg font-semibold">App installed</p>
        <p className="mt-1 text-sm text-white/70">Friends Media is already available from your home screen.</p>
      </div>
    );
  }

  if (showIosHint && !promptEvent) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4">
        <p className="text-lg font-semibold">Install on iPhone</p>
        <p className="mt-1 text-sm text-white/70">Open Safari share menu, then tap Add to Home Screen.</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      disabled={!promptEvent || isInstalling}
      className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white/8 px-5 py-4 text-left transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div>
        <p className="text-lg font-semibold">Install App</p>
        <p className="mt-1 text-sm text-white/70">
          {promptEvent ? "Add Friends Media to your phone home screen." : "Install option appears when your browser is ready."}
        </p>
      </div>
      <span className="rounded-full border border-white/15 bg-white/10 p-3">
        <Download className="h-5 w-5" />
      </span>
    </button>
  );
}
