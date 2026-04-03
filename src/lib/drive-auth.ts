import { google } from "googleapis";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const REFRESH_TOKEN_KEY = "google_drive_refresh_token";

export async function getStoredRefreshToken() {
  if (env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    return env.GOOGLE_DRIVE_REFRESH_TOKEN;
  }

  const config = await prisma.appConfig.findUnique({
    where: { key: REFRESH_TOKEN_KEY },
  });

  return config?.value ?? "";
}

export async function setStoredRefreshToken(value: string) {
  await prisma.appConfig.upsert({
    where: { key: REFRESH_TOKEN_KEY },
    update: { value },
    create: {
      key: REFRESH_TOKEN_KEY,
      value,
    },
  });
}

export async function getGoogleOAuthClient() {
  const client = new google.auth.OAuth2(
    env.GOOGLE_DRIVE_CLIENT_ID,
    env.GOOGLE_DRIVE_CLIENT_SECRET,
    env.GOOGLE_DRIVE_REDIRECT_URI,
  );

  const refreshToken = await getStoredRefreshToken();

  if (refreshToken) {
    client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return client;
}

export async function ensureGoogleDriveAccess() {
  const client = await getGoogleOAuthClient();
  const refreshToken = await getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("Google Drive has not been connected yet.");
  }

  return client;
}

