"use client";

import { ImagePlus, Sparkles, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getDefaultRequestError, optimizeFilesForUpload, readApiPayload } from "@/lib/client-upload";

type UploadFormProps = {
  group: {
    id: string;
    name: string;
  };
  categories: string[];
};

export function UploadForm({ group, categories }: UploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-card overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.1)]"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setInfo("");
        setMessage("");
        const form = event.currentTarget;
        const formData = new FormData(form);
        const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

        if (!category) {
          setError("Select a category before uploading.");
          return;
        }

        if (files.length === 0) {
          setError("At least one file is required.");
          return;
        }

        startTransition(async () => {
          try {
            const prepared = await optimizeFilesForUpload(files);

            if (prepared.oversizedImagesRemaining > 0) {
              setError("Some selected photos are still too large for mobile upload. Please choose smaller photos or upload fewer at once.");
              return;
            }

            const uploadFormData = new FormData();
            uploadFormData.append("groupId", group.id);
            uploadFormData.append("category", category);

            prepared.files.forEach((file) => {
              uploadFormData.append("files", file, file.name);
            });

            if (prepared.optimizedImageCount > 0) {
              setInfo(
                `${prepared.optimizedImageCount} image${prepared.optimizedImageCount === 1 ? "" : "s"} prepared for mobile upload before sending.`,
              );
            }

            const response = await fetch("/api/upload", {
              method: "POST",
              body: uploadFormData,
            });

            const payload = await readApiPayload(response);
            if (!response.ok) {
              setError(
                String(payload.error || getDefaultRequestError(response.status, "Upload failed. Please try again.")),
              );
              return;
            }

            const responseMessage = typeof payload.message === "string" ? payload.message : "Upload complete.";
            setMessage(
              prepared.optimizedImageCount > 0
                ? `${responseMessage} ${prepared.optimizedImageCount} image${prepared.optimizedImageCount === 1 ? "" : "s"} optimized for mobile upload.`
                : responseMessage,
            );
            form.reset();
            setCategory("");
            setSelectedFiles([]);
            router.push("/moments");
            router.refresh();
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Upload failed. Please try again.");
          }
        });
      }}
    >
      <div className="grid gap-5 p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
        <input type="hidden" name="groupId" value={group.id} />
        <input type="hidden" name="category" value={category} />

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Secure Upload</p>
            <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">Upload moments into your shared circle</h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Pick a category first, then select one file or many. Every upload lands in the shared gallery, opens in a large viewer,
              and stays downloadable for approved members.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white/70 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="rounded-[22px] bg-[rgba(43,91,77,0.1)] p-3 text-[var(--forest)]">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Upload destination</p>
                <p className="mt-2 break-words text-2xl font-semibold">{group.name}</p>
                <p className="mt-2 break-words text-sm leading-7 text-[var(--muted)]">
                  Everyone in the private circle can open and download this upload after it lands in the shared gallery.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Files</span>
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/70 transition hover:border-[var(--accent)]">
              <label className="block cursor-pointer p-4 sm:p-5">
                <input
                  name="files"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={(event) => {
                    const nextFiles = Array.from(event.currentTarget.files ?? []).map((file) => file.name);
                    setSelectedFiles(nextFiles);
                  }}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)]">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected` : "Choose photos or videos"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      Mobile photos are optimized automatically before upload to avoid hosted server limits.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
                    Browse files
                  </span>
                </div>
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 ? (
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[rgba(177,85,42,0.1)] p-2 text-[var(--accent)]">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">
                  {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} ready
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFiles.map((fileName, index) => (
                  <span
                    key={`${fileName}-${index}`}
                    className="max-w-full break-all rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4 text-sm leading-7 text-[var(--muted)]">
            Up to 20 files at once. Photos are prepared for mobile-friendly upload first, then checked again on the server. Videos still depend on hosted server limits.
          </div>
        </div>

        <div className="rounded-[30px] border border-[rgba(43,91,77,0.12)] bg-[linear-gradient(180deg,rgba(43,91,77,0.98),rgba(28,58,50,0.98))] p-5 text-white shadow-[0_26px_60px_rgba(20,34,29,0.26)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Step 1</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">Choose a category</h2>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Category selection is required. This helps everyone browse the shared gallery more easily later.
          </p>

          <div className="mt-6 grid gap-3">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`rounded-[24px] border px-5 py-4 text-left transition ${
                  category === option
                    ? "border-transparent bg-[var(--forest)] text-white shadow-[0_18px_35px_rgba(15,118,110,0.22)]"
                    : "border-white/12 bg-white/8 text-white hover:bg-white/12"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      category === option ? "bg-[rgba(255,255,255,0.15)] text-white" : "bg-white/12 text-white"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-base font-semibold text-white">{option}</p>
                    <p className={`mt-1 text-sm ${category === option ? "text-white/90" : "text-white/70"}`}>
                      {category === option ? "Selected for this upload." : "Tap to choose this category before uploading."}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-white/12 bg-white/8 px-4 py-4">
            <p className="text-sm font-medium">{category ? `Selected: ${category}` : "No category selected yet"}</p>
            <p className="mt-1 text-sm text-white/70">
              {category ? "You can now choose files and upload them." : "You must select one category before the upload can continue."}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-white/70 px-4 py-5 sm:px-6 sm:py-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm text-[var(--muted)]">{info}</p> : null}
        {message ? <p className="text-sm text-[var(--forest)]">{message}</p> : null}

        <button
          type="submit"
          disabled={pending || !category}
          className="mt-4 rounded-[22px] bg-[var(--accent)] px-7 py-3.5 font-medium text-white shadow-[0_20px_40px_rgba(177,85,42,0.22)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Uploading..." : category ? "Upload files" : "Select category first"}
        </button>
      </div>
    </form>
  );
}
