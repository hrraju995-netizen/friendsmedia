"use client";

import type { Route } from "next";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const fallbackCallbackUrl: Route = "/gallery";
const allowedCallbackPaths = new Set<string>(["/", "/gallery", "/moments", "/my-uploads", "/login", "/register", "/upload", "/profile"]);

function getSafeCallbackUrl(rawCallbackUrl: string | null): Route {
  if (!rawCallbackUrl) {
    return fallbackCallbackUrl;
  }

  try {
    const url = new URL(rawCallbackUrl, window.location.origin);

    if (url.origin !== window.location.origin || !allowedCallbackPaths.has(url.pathname)) {
      return fallbackCallbackUrl;
    }

    return `${url.pathname}${url.search}${url.hash}` as Route;
  } catch {
    return fallbackCallbackUrl;
  }
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card animate-fade-in-up rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");

        startTransition(async () => {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
          });

          if (result?.error) {
            setError("Email or password is incorrect.");
            return;
          }

          router.push(callbackUrl);
          router.refresh();
        });
      }}
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-[var(--accent)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-[var(--forest)] opacity-20 blur-3xl pointer-events-none" />
      
      <div className="space-y-2 relative z-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Member Login</p>
        <h1 className="font-serif text-[2.5rem] font-semibold text-gradient">Welcome back</h1>
        <p className="text-sm text-[var(--muted)] max-w-xs mx-auto pt-2">
          Use the credentials stored in your own database and keep media sharing private.
        </p>
      </div>

      <div className="mt-8 space-y-5 relative z-10">
        <label className="block space-y-2">
          <span className="text-sm font-medium ml-1">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-white/60 backdrop-blur-md px-4 py-3.5 outline-none transition-all focus:border-[var(--accent)] focus:bg-white/70 focus:ring-4 focus:ring-[rgba(94,106,210,0.1)] focus:shadow-[0_0_15px_rgba(94,106,210,0.2)] shadow-inner"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium ml-1">Password</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-white/60 backdrop-blur-md px-4 py-3.5 outline-none transition-all focus:border-[var(--accent)] focus:bg-white/70 focus:ring-4 focus:ring-[rgba(94,106,210,0.1)] focus:shadow-[0_0_15px_rgba(94,106,210,0.2)] shadow-inner"
            placeholder="Password"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100 text-center">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] px-4 py-4 font-medium text-white shadow-[0_12px_24px_rgba(94,106,210,0.3)] transition-all hover:shadow-[0_16px_32px_rgba(94,106,210,0.6)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:transform-none relative z-10"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
