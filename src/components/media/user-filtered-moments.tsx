"use client";

import { useMemo, useState } from "react";

import { SharedMomentsGallery, type GalleryItem } from "@/components/media/shared-moments-gallery";
import { cn } from "@/lib/utils";

type UserFilteredMomentsProps = {
  items: GalleryItem[];
  showUploaderFilter?: boolean;
  allItemsLabel?: string;
  categoryItemsLabelPrefix?: string;
};

export function UserFilteredMoments({
  items,
  showUploaderFilter = true,
  allItemsLabel = "Showing uploads from everyone",
  categoryItemsLabelPrefix = "Showing",
}: UserFilteredMomentsProps) {
  const [selectedUploaderId, setSelectedUploaderId] = useState<"all" | string>("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | string>("all");

  const uploaders = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; count: number }>();

    for (const item of items) {
      const existing = seen.get(item.uploaderId);

      if (existing) {
        existing.count += 1;
        continue;
      }

      seen.set(item.uploaderId, {
        id: item.uploaderId,
        name: item.uploaderName,
        count: 1,
      });
    }

    return Array.from(seen.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [items]);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort((left, right) => left.localeCompare(right)), [items]);

  const filteredByCategory = selectedCategory === "all" ? items : items.filter((item) => item.category === selectedCategory);
  const filteredItems =
    showUploaderFilter && selectedUploaderId !== "all"
      ? filteredByCategory.filter((item) => item.uploaderId === selectedUploaderId)
      : filteredByCategory;
  const selectedUploader = uploaders.find((uploader) => uploader.id === selectedUploaderId) ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              selectedCategory === "all"
                ? "border-transparent bg-[var(--forest)] text-white"
                : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:border-[var(--forest)] hover:text-[var(--forest)]",
            )}
          >
            All categories
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                selectedCategory === category
                  ? "border-transparent bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {showUploaderFilter ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSelectedUploaderId("all")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                selectedUploaderId === "all"
                  ? "border-transparent bg-[var(--forest)] text-white"
                  : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:border-[var(--forest)] hover:text-[var(--forest)]",
              )}
            >
              Everyone
            </button>

            {uploaders.map((uploader) => (
              <button
                key={uploader.id}
                type="button"
                onClick={() => setSelectedUploaderId(uploader.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedUploaderId === uploader.id
                    ? "border-transparent bg-[var(--gold)] text-[var(--foreground)]"
                    : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:border-[var(--gold)] hover:text-[var(--foreground)]",
                )}
              >
                {uploader.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-white/55 px-5 py-4 text-sm text-[var(--muted)]">
        <p>
          {selectedUploader && showUploaderFilter
            ? `${selectedUploader.name}'s ${selectedCategory === "all" ? "uploads" : selectedCategory.toLowerCase()}`
            : selectedCategory === "all"
              ? allItemsLabel
              : `${categoryItemsLabelPrefix} ${selectedCategory.toLowerCase()} uploads`}
        </p>
        <p className="font-medium text-[var(--foreground)]">
          {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
        </p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white/50 p-6 text-sm text-[var(--muted)]">
          No uploads found for this user yet.
        </div>
      ) : (
        <SharedMomentsGallery items={filteredItems} />
      )}
    </div>
  );
}
