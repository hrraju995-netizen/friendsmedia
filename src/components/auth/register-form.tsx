"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card animate-fade-in-up rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.get("name"),
              email: formData.get("email"),
              password: formData.get("password"),
            }),
          });

          const payload = (await response.json()) as { error?: string; message?: string };

          if (!response.ok) {
            setError(payload.error || "Registration failed.");
            return;
          }

          setSuccess("Account created. You can sign in now.");
          router.push("/login");
          router.refresh();
        });
      }}
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-[var(--accent)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-[var(--forest)] opacity-20 blur-3xl pointer-events-none" />
      
      <div className="space-y-2 relative z-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Create Account</p>
        <h1 className="font-serif text-[2.5rem] font-semibold text-gradient">Start your space</h1>
        <p className="text-sm leading-6 text-[var(--muted)] max-w-[16rem] mx-auto pt-2">
          Sign up with email and password. Group invites can be sent later from the app.
        </p>
      </div>

      <div className="mt-8 space-y-5 relative z-10">
        <label className="block space-y-2">
          <span className="text-sm font-medium ml-1">Name</span>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-2xl border border-[var(--border)] bg-white/60 backdrop-blur-md px-4 py-3.5 outline-none transition-all focus:border-[var(--accent)] focus:bg-white/80 focus:ring-4 focus:ring-[rgba(94,106,210,0.1)] focus:shadow-[0_0_15px_rgba(94,106,210,0.2)] shadow-sm"
            placeholder="Your name"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium ml-1">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-[var(--border)] bg-white/60 backdrop-blur-md px-4 py-3.5 outline-none transition-all focus:border-[var(--accent)] focus:bg-white/80 focus:ring-4 focus:ring-[rgba(94,106,210,0.1)] focus:shadow-[0_0_15px_rgba(94,106,210,0.2)] shadow-sm"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium ml-1">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-2xl border border-[var(--border)] bg-white/60 backdrop-blur-md px-4 py-3.5 outline-none transition-all focus:border-[var(--accent)] focus:bg-white/80 focus:ring-4 focus:ring-[rgba(94,106,210,0.1)] focus:shadow-[0_0_15px_rgba(94,106,210,0.2)] shadow-sm"
            placeholder="At least 8 characters"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100 text-center relative z-10">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[var(--forest)] bg-[#1e453a10] p-3 rounded-xl border border-[#1e453a20] text-center relative z-10">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] px-4 py-4 font-medium text-white shadow-[0_12px_24px_rgba(94,106,210,0.3)] transition-all hover:shadow-[0_16px_32px_rgba(94,106,210,0.6)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:transform-none relative z-10"
      >
        {pending ? "Creating..." : "Create account"}
      </button>

      <p className="mt-6 text-sm text-center text-[var(--muted)] relative z-10">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}

