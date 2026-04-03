import { z } from "zod";

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const videoMimeTypes = ["video/mp4", "video/webm", "video/quicktime"] as const;
const allowedMimeTypes = new Set<string>([...imageMimeTypes, ...videoMimeTypes]);

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(80),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
});

export function assertAllowedMimeType(mimeType: string) {
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error("Unsupported file type.");
  }
}

export function validateImage(file: File) {
  if (!imageMimeTypes.includes(file.type as (typeof imageMimeTypes)[number])) {
    throw new Error("Only jpg, png, and webp images are allowed.");
  }

  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be between 1 byte and 10 MB.");
  }
}

export function validateVideo(file: File) {
  if (!videoMimeTypes.includes(file.type as (typeof videoMimeTypes)[number])) {
    throw new Error("Only mp4, webm, and mov videos are allowed.");
  }

  if (file.size === 0 || file.size > 50 * 1024 * 1024) {
    throw new Error("Videos must be between 1 byte and 50 MB.");
  }
}

export function assertMagicBytes(buffer: Buffer, mimeType: string) {
  const signature = buffer.subarray(0, 12);

  if (mimeType === "image/jpeg" && !(signature[0] === 0xff && signature[1] === 0xd8)) {
    throw new Error("Invalid JPEG file.");
  }

  if (mimeType === "image/png" && signature.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    throw new Error("Invalid PNG file.");
  }

  if (mimeType === "image/webp" && !(signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP")) {
    throw new Error("Invalid WebP file.");
  }

  if (mimeType === "video/mp4" && !signature.includes(Buffer.from("ftyp"))) {
    throw new Error("Invalid MP4 file.");
  }

  if (mimeType === "video/webm" && signature.toString("hex", 0, 4) !== "1a45dfa3") {
    throw new Error("Invalid WebM file.");
  }

  if (mimeType === "video/quicktime" && !signature.includes(Buffer.from("ftyp"))) {
    throw new Error("Invalid MOV file.");
  }
}
