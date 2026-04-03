"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";
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
    <div className="glass-card flex flex-col gap-4 rounded-[32px] border px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Avatar name={userName} src={userImage} />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Friends Media</p>
          <h2 className="text-xl font-semibold">Welcome back, {userName}</h2>
          <p className="text-sm text-[var(--muted)]">{userRole === "super_admin" ? "Main admin" : "Member"} access</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
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
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-70"
          disabled={pending}
        >
          <LogOut className="h-4 w-4" />
          {pending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
