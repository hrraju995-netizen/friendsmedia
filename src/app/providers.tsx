"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AppBootScreen } from "@/components/layout/app-boot-screen";
import { PwaRegister } from "@/components/pwa/pwa-register";

export function Providers({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <SessionProvider>
      <PwaRegister />
      {hydrated ? (
        <div suppressHydrationWarning>{children}</div>
      ) : (
        <div suppressHydrationWarning>
          <AppBootScreen />
        </div>
      )}
    </SessionProvider>
  );
}
