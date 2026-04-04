"use client";

import Image from "next/image";
import { Download, Play, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { Avatar } from "@/components/ui/avatar";
import { getMediaCategoryLabel, type MediaCategory } from "@/lib/media-categories";

export type GalleryItem = {
  id: string;
  fileName: string;
  mediaType: string;
  category: MediaCategory;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string | null;
  canDelete?: boolean;
};

type SharedMomentsGalleryProps = {
  items: GalleryItem[];
};

export function SharedMomentsGallery({ items }: SharedMomentsGalleryProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    setDeleteError("");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItem]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (activeItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeItem, mounted]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {items.map((item) => {
          const mediaUrl = `/api/media/${item.id}/stream`;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className="group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[#f5efe1] text-left shadow-[0_18px_36px_rgba(34,25,16,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(34,25,16,0.16)] sm:rounded-[28px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#d8c3a2]">
                {item.mediaType === "image" ? (
                  <Image
                    src={mediaUrl}
                    alt={item.uploaderName}
                    fill
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <>
                    <video
                      src={mediaUrl}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.48))]" />
                    <div className="absolute right-4 top-4 rounded-full bg-black/45 p-3 text-white">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(10,10,10,0.76))] px-3 pb-3 pt-10 sm:px-4 sm:pb-4 sm:pt-12">
                  <div className="mb-2 sm:mb-3">
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/88 sm:px-3 sm:text-xs">
                      {getMediaCategoryLabel(item.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white sm:gap-3">
                    <Avatar
                      name={item.uploaderName}
                      src={item.uploaderAvatar}
                      className="h-9 w-9 border-white/35 bg-white/18 text-white sm:h-11 sm:w-11"
                      textClassName="text-white"
                    />
                    <div>
                      <p className="text-xs font-medium sm:text-sm">{item.uploaderName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mounted && activeItem
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] bg-[rgba(10,9,8,0.88)] backdrop-blur-md"
              onClick={() => setActiveId(null)}
            >
              <div
                className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#11110f] text-white shadow-[0_32px_80px_rgba(0,0,0,0.45)] sm:m-4 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl sm:rounded-[32px] sm:border sm:border-white/10"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white shadow-lg transition hover:bg-black/60"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close viewer</span>
                </button>

                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-4 pr-16 sm:flex-nowrap sm:items-center sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={activeItem.uploaderName}
                      src={activeItem.uploaderAvatar}
                      className="h-11 w-11 border-white/20 bg-white/10 text-white"
                      textClassName="text-white"
                    />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.26em] text-white/45">Shared Moment</p>
                      <p className="truncate text-sm font-medium text-white/88">{activeItem.uploaderName}</p>
                      <p className="mt-1 text-xs text-white/55">{getMediaCategoryLabel(activeItem.category)}</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {activeItem.canDelete ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            setDeleteError("");

                            const response = await fetch(`/api/media/${activeItem.id}`, {
                              method: "DELETE",
                            });

                            const payload = (await response.json()) as { error?: string };
                            if (!response.ok) {
                              setDeleteError(payload.error || "Could not delete this media.");
                              return;
                            }

                            setActiveId(null);
                            router.refresh();
                          })
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-400/22 bg-red-500/12 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/18 disabled:opacity-60 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        {pending ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                    <a
                      href={`/api/media/${activeItem.id}/download`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/16 sm:flex-none"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>

                {deleteError ? <p className="border-b border-white/10 px-4 py-3 text-sm text-red-300 sm:px-5">{deleteError}</p> : null}

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#0b0b09] p-3 pb-5 sm:p-8">
                  {activeItem.mediaType === "image" ? (
                    <Image
                      src={`/api/media/${activeItem.id}/stream`}
                      alt={activeItem.uploaderName}
                      width={1600}
                      height={1200}
                      unoptimized
                      className="block h-auto max-h-[calc(100dvh-11rem)] w-auto max-w-full rounded-[20px] object-contain sm:max-h-full sm:rounded-[24px]"
                    />
                  ) : (
                    <video
                      src={`/api/media/${activeItem.id}/stream`}
                      className="max-h-[calc(100dvh-11rem)] w-full rounded-[20px] bg-black object-contain sm:max-h-full sm:rounded-[24px]"
                      controls
                      autoPlay
                    />
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
