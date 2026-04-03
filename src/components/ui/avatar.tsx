"use client";

import Image from "next/image";

import { getInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
  textClassName?: string;
};

export function Avatar({ name, src, className, textClassName }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-[rgba(47,93,80,0.14)] text-sm font-semibold text-[var(--forest)] shadow-[0_14px_30px_rgba(34,25,16,0.14)]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={name} fill unoptimized className="object-cover" />
      ) : (
        <span className={cn("font-medium", textClassName)}>{getInitials(name)}</span>
      )}
    </div>
  );
}
