"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminCategoryManagerProps = {
  categories: string[];
};

export function AdminCategoryManager({ categories }: AdminCategoryManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setMessage("");

          startTransition(async () => {
            const response = await fetch("/api/admin/categories", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name }),
            });

            const payload = (await response.json()) as { error?: string; message?: string };
            if (!response.ok) {
              setError(payload.error || "Could not add the category.");
              return;
            }

            setMessage(payload.message || "Category added.");
            setName("");
            router.refresh();
          });
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Add a new upload category"
            className="min-w-0 flex-1 rounded-[20px] border border-[var(--border)] bg-white/80 px-5 py-3.5 outline-none transition focus:border-[var(--forest)] focus:bg-white"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-[20px] bg-[var(--forest)] px-5 py-3.5 text-sm font-medium text-white shadow-[0_18px_35px_rgba(43,91,77,0.22)] transition hover:opacity-92 disabled:opacity-70"
          >
            {pending ? "Saving..." : "Add category"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <div
            key={category}
            className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm"
          >
            <span>{category}</span>
            <button
              type="button"
              disabled={pending && pendingDelete === category}
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  setMessage("");
                  setPendingDelete(category);

                  const response = await fetch("/api/admin/categories", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: category }),
                  });

                  const payload = (await response.json()) as { error?: string; message?: string };
                  if (!response.ok) {
                    setError(payload.error || "Could not remove the category.");
                    setPendingDelete(null);
                    return;
                  }

                  setMessage(payload.message || "Category removed.");
                  setPendingDelete(null);
                  router.refresh();
                })
              }
              className="rounded-full border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              aria-label={`Delete ${category}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <p className="rounded-[20px] border border-[var(--border)] bg-white/55 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
        Categories appear on the upload page and in the moments filters. Members must choose one before uploading.
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--forest)]">{message}</p> : null}
    </div>
  );
}
