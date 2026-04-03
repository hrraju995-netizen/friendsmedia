"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CreateGroupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card rounded-[24px] p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const response = await fetch("/api/groups", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.get("name"),
            }),
          });

          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error || "Could not create the group.");
            return;
          }

          form.reset();
          router.refresh();
        });
      }}
    >
      <h3 className="text-lg font-semibold">Create a new group</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Each group gets its own Drive folder and membership list.</p>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Group name</span>
        <input
          name="name"
          type="text"
          required
          className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 outline-none transition focus:border-[var(--forest)]"
          placeholder="Weekend Memories"
        />
      </label>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-[var(--forest)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "Creating..." : "Create group"}
      </button>
    </form>
  );
}
