import crypto from "node:crypto";

import { slugify } from "@/lib/utils";

export function sanitizeFileName(fileName: string) {
  const extIndex = fileName.lastIndexOf(".");
  const extension = extIndex >= 0 ? fileName.slice(extIndex) : "";
  const baseName = extIndex >= 0 ? fileName.slice(0, extIndex) : fileName;
  const normalized = slugify(baseName) || "upload";
  return `${normalized}-${crypto.randomUUID().slice(0, 8)}${extension.toLowerCase()}`;
}

export function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
