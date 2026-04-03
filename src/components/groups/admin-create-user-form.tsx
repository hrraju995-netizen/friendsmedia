"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminCreateUserForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const response = await fetch("/api/admin/users", {
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
            setError(payload.error || "Could not create the user.");
            return;
          }

          setMessage(payload.message || "User account created.");
          form.reset();
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          type="text"
          required
          className="rounded-[20px] border border-[var(--border)] bg-white/80 px-5 py-3.5 outline-none transition focus:border-[var(--forest)] focus:bg-white"
          placeholder="Member name"
        />
        <input
          name="email"
          type="email"
          required
          className="rounded-[20px] border border-[var(--border)] bg-white/80 px-5 py-3.5 outline-none transition focus:border-[var(--forest)] focus:bg-white"
          placeholder="Member email"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="password"
          type="text"
          required
          minLength={8}
          className="min-w-0 flex-1 rounded-[20px] border border-[var(--border)] bg-white/80 px-5 py-3.5 outline-none transition focus:border-[var(--forest)] focus:bg-white"
          placeholder="Temporary password"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[20px] bg-[var(--forest)] px-5 py-3.5 text-sm font-medium text-white shadow-[0_18px_35px_rgba(43,91,77,0.22)] transition hover:opacity-92 disabled:opacity-70"
        >
          {pending ? "Creating..." : "Create user"}
        </button>
      </div>

      <p className="rounded-[20px] border border-[var(--border)] bg-white/55 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
        The account joins the shared gallery automatically. The user can later change password and profile photo from the profile page.
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--forest)]">{message}</p> : null}
    </form>
  );
}
