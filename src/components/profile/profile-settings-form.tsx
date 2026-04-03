"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";

type ProfileSettingsFormProps = {
  currentName: string;
  currentAvatar: string | null;
  email: string;
};

export function ProfileSettingsForm({ currentName, currentAvatar, email }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card rounded-[32px] border p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const response = await fetch("/api/profile", {
            method: "PATCH",
            body: formData,
          });

          const payload = (await response.json()) as { error?: string; message?: string };
          if (!response.ok) {
            setError(payload.error || "Could not save your profile.");
            return;
          }

          setMessage(payload.message || "Profile updated.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-white/70 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Preview</p>
          <div className="mt-5 flex flex-col items-center text-center">
            <Avatar name={currentName} src={preview} className="h-28 w-28 text-2xl" textClassName="text-2xl" />
            <h2 className="mt-4 font-serif text-3xl font-semibold">{currentName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{email}</p>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Profile Settings</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold">Make your profile feel personal</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Update your display name and add a profile picture. Your avatar appears on the shared moments gallery.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Display name</span>
              <input
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                defaultValue={currentName}
                className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--forest)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Profile photo</span>
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full rounded-2xl border border-dashed border-[var(--border)] bg-white/70 px-4 py-3 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[var(--forest)] file:px-4 file:py-2 file:text-white hover:border-[var(--forest)]"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];

                  if (!file) {
                    setPreview(currentAvatar);
                    return;
                  }

                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>

            <div className="grid gap-4 rounded-[28px] border border-[var(--border)] bg-white/70 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm font-medium">Change password</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Leave these blank if you do not want to update the password right now.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Current password</span>
                <input
                  name="currentPassword"
                  type="password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--forest)]"
                  placeholder="Current password"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">New password</span>
                <input
                  name="newPassword"
                  type="password"
                  minLength={8}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--forest)]"
                  placeholder="New password"
                />
              </label>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-[var(--forest)]">{message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 rounded-full bg-[var(--forest)] px-6 py-3 font-medium text-white transition hover:opacity-92 disabled:opacity-70"
          >
            {pending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
