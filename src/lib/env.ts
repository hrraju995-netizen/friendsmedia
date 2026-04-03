import { z } from "zod";

const envSchema = z.object({
  APP_NAME: z.string().default("Friends Media App"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL").optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  GOOGLE_DRIVE_CLIENT_ID: z.string().default(""),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_DRIVE_REDIRECT_URI: z.string().default(""),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().default(""),
  GOOGLE_DRIVE_REFRESH_TOKEN: z.string().default(""),
});

export const env = envSchema.parse({
  APP_NAME: process.env.APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
  GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  GOOGLE_DRIVE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

export function isDriveConfigured() {
  return Boolean(
    env.GOOGLE_DRIVE_CLIENT_ID &&
      env.GOOGLE_DRIVE_CLIENT_SECRET &&
      env.GOOGLE_DRIVE_REDIRECT_URI &&
      env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  );
}

