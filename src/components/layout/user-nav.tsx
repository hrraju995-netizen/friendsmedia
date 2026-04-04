"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/gallery", label: "Dashboard" },
  { href: "/moments", label: "Moments" },
  { href: "/my-uploads", label: "My Uploads" },
  { href: "/upload", label: "Upload" },
  { href: "/profile", label: "Profile" },
] satisfies Array<{ href: Route; label: string }>;

export function UserNav({
  userName,
  userImage,
  userRole,
}: {
  userName: string;
  userImage?: string | null;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="glass-card flex flex-col gap-4 overflow-visible rounded-[32px] border px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar name={userName} src={userImage} />
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Friends Media</p>
          <h2 className="break-words text-lg font-semibold sm:text-xl">Welcome back, {userName}</h2>
          <p className="text-sm text-[var(--muted)]">{userRole === "super_admin" ? "Main admin" : "Member"} access</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <NotificationsCenter />

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-2 text-xs transition sm:px-4 sm:text-sm",
              pathname === item.href
                ? "border-transparent bg-[var(--forest)] text-white"
                : "border-[var(--border)] bg-white/60 hover:border-[var(--forest)] hover:text-[var(--forest)]",
            )}
          >
            {item.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await signOut({ callbackUrl: "/login" });
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-70 sm:px-4 sm:text-sm"
          disabled={pending}
        >
          <LogOut className="h-4 w-4" />
          {pending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
