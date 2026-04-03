"use client";

import { ImagePlus, Sparkles, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as { error?: string; message?: string };
          if (!response.ok) {
            setError(payload.error || "Upload failed.");
            return;
          }

          setMessage(payload.message || "Upload complete.");
          form.reset();
          setCategory("");
          setSelectedFiles([]);
          router.push("/moments");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-8 p-8 lg:grid-cols-[1.08fr_0.92fr]">
        <input type="hidden" name="groupId" value={group.id} />
        <input type="hidden" name="category" value={category} />

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Secure Upload</p>
            <h1 className="font-serif text-4xl font-semibold leading-tight">Upload moments into your shared circle</h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Pick a category first, then select one file or many. Every upload lands in the shared gallery, opens in a large viewer,
              and stays downloadable for approved members.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white/70 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-[22px] bg-[rgba(43,91,77,0.1)] p-3 text-[var(--forest)]">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload destination</p>
                <p className="mt-2 text-2xl font-semibold">{group.name}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Everyone in the private circle can open and download this upload after it lands in the shared gallery.
                </p>
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Files</span>
            <input
              name="files"
              type="file"
              required
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              className="w-full rounded-[24px] border border-dashed border-[var(--border)] bg-white/70 px-4 py-4 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-white hover:border-[var(--accent)]"
              onChange={(event) => {
                const nextFiles = Array.from(event.currentTarget.files ?? []).map((file) => file.name);
                setSelectedFiles(nextFiles);
              }}
            />
          </label>

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
                    className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4 text-sm leading-7 text-[var(--muted)]">
            Up to 20 files at once. Images up to 10 MB each, videos up to 50 MB each. Upload routes run on Node.js and enforce membership checks.
          </div>
        </div>

        <div className="rounded-[30px] border border-[rgba(43,91,77,0.12)] bg-[linear-gradient(180deg,rgba(43,91,77,0.98),rgba(28,58,50,0.98))] p-6 text-white shadow-[0_26px_60px_rgba(20,34,29,0.26)]">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Step 1</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Choose a category</h2>
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
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      category === option ? "bg-[rgba(255,255,255,0.15)] text-white" : "bg-white/12 text-white"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{option}</p>
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

      <div className="border-t border-[var(--border)] bg-white/70 px-8 py-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
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
