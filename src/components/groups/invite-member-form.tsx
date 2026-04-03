"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const response = await fetch(`/api/groups/${groupId}/invite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.get("email"),
            }),
          });

          const payload = (await response.json()) as { error?: string; message?: string };
          if (!response.ok) {
            setError(payload.error || "Could not invite member.");
            return;
          }

          setMessage(payload.message || "Member added.");
          form.reset();
          router.refresh();
        });
      }}
    >
      <input
        name="email"
        type="email"
        required
        className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 outline-none transition focus:border-[var(--forest)]"
        placeholder="Add member by email"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-70"
      >
        {pending ? "Inviting..." : "Invite"}
      </button>
      {error ? <p className="text-sm text-red-700 sm:basis-full">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--forest)] sm:basis-full">{message}</p> : null}
    </form>
  );
}
