"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/ui/avatar";
import { getDefaultRequestError, optimizeFilesForUpload, readApiPayload } from "@/lib/client-upload";

type ProfileSettingsFormProps = {
  currentName: string;
  currentAvatar: string | null;
  email: string;
};

export function ProfileSettingsForm({ currentName, currentAvatar, email }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card rounded-[28px] border p-4 sm:rounded-[32px] sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setInfo("");
        setMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          try {
            const requestFormData = new FormData();
            requestFormData.append("name", String(formData.get("name") || ""));
            requestFormData.append("currentPassword", String(formData.get("currentPassword") || ""));
            requestFormData.append("newPassword", String(formData.get("newPassword") || ""));

            const image = formData.get("image");
            if (image instanceof File && image.size > 0) {
              const prepared = await optimizeFilesForUpload([image]);

              if (prepared.oversizedImagesRemaining > 0) {
                setError("This photo is still too large for mobile upload. Please choose a smaller image.");
                return;
              }

              requestFormData.append("image", prepared.files[0], prepared.files[0].name);

              if (prepared.optimizedImageCount > 0) {
                setInfo("Your profile photo was prepared for mobile upload before sending.");
              }
            }

            const response = await fetch("/api/profile", {
              method: "PATCH",
              body: requestFormData,
            });

            const payload = await readApiPayload(response);
            if (!response.ok) {
              setError(
                String(payload.error || getDefaultRequestError(response.status, "Could not save your profile.")),
              );
              return;
            }

            setMessage(typeof payload.message === "string" ? payload.message : "Profile updated.");
            router.refresh();
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not save your profile.");
          }
        });
      }}
    >
      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4 sm:rounded-[28px] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Preview</p>
          <div className="mt-4 flex flex-col items-center text-center sm:mt-5">
            <Avatar name={currentName} src={preview} className="h-24 w-24 text-xl sm:h-28 sm:w-28 sm:text-2xl" textClassName="text-xl sm:text-2xl" />
            <h2 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">{currentName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{email}</p>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Profile Settings</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Make your profile feel personal</h1>

          <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
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
              <label className="block cursor-pointer rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 transition hover:border-[var(--forest)]">
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];

                    if (!file) {
                      setPreview(currentAvatar);
                      return;
                    }

                    setPreview(URL.createObjectURL(file));
                  }}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)]">Choose profile photo</p>
                    <p className="truncate text-sm text-[var(--muted)]">{preview ? "Preview updated" : "JPG, PNG, or WebP"}</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-medium text-white">Browse</span>
                </div>
              </label>
            </label>

            <div className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/70 p-4 md:grid-cols-2 sm:rounded-[28px] sm:p-5">
              <div className="md:col-span-2">
                <p className="text-sm font-medium">Change password</p>
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
          {info ? <p className="mt-4 text-sm text-[var(--muted)]">{info}</p> : null}
          {message ? <p className="mt-4 text-sm text-[var(--forest)]">{message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-full bg-[var(--forest)] px-6 py-3 font-medium text-white transition hover:opacity-92 disabled:opacity-70 sm:w-auto"
          >
            {pending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
