import { Readable } from "node:stream";

import { google } from "googleapis";

import { env, isDriveConfigured } from "@/lib/env";
import { ensureGoogleDriveAccess } from "@/lib/drive-auth";

async function getDriveClient() {
  if (!isDriveConfigured()) {
    throw new Error("Google Drive environment variables are not configured.");
  }

  const auth = await ensureGoogleDriveAccess();

  return google.drive({
    version: "v3",
    auth,
  });
}

export async function findOrCreateFolder(name: string, parentId?: string) {
  const drive = await getDriveClient();
  const escapedName = name.replace(/'/g, "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";

  const existing = await drive.files.list({
    q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  const folder = existing.data.files?.[0];
  if (folder?.id) {
    return folder.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });

  if (!created.data.id) {
    throw new Error("Could not create Google Drive folder.");
  }

  return created.data.id;
}

export async function ensureGroupFolders(groupId: string) {
  const groupsRootId = await findOrCreateFolder("groups", env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  const groupFolderId = await findOrCreateFolder(`group-${groupId}`, groupsRootId);
  const imagesFolderId = await findOrCreateFolder("images", groupFolderId);
  const videosFolderId = await findOrCreateFolder("videos", groupFolderId);

  return {
    groupFolderId,
    imagesFolderId,
    videosFolderId,
  };
}

export async function ensureProfilePhotosFolder() {
  const profilesRootId = await findOrCreateFolder("profiles", env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  return findOrCreateFolder("avatars", profilesRootId);
}

export async function uploadSmallFile(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folderId: string;
}) {
  const drive = await getDriveClient();
  const stream = Readable.from(input.buffer);

  const response = await drive.files.create({
    requestBody: {
      name: input.fileName,
      parents: [input.folderId],
    },
    media: {
      mimeType: input.mimeType,
      body: stream,
    },
    fields: "id, name, mimeType, webViewLink",
  });

  if (!response.data.id) {
    throw new Error("Google Drive did not return a file ID.");
  }

  return response.data;
}

export async function getDriveFileMetadata(fileId: string) {
  const drive = await getDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, webViewLink",
  });

  return response.data;
}

export async function deleteDriveFile(fileId: string) {
  const drive = await getDriveClient();
  await drive.files.delete({ fileId });
}

export async function streamDriveFile(fileId: string) {
  const drive = await getDriveClient();

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    {
      responseType: "stream",
    },
  );

  return response.data as Readable;
}

export function nodeStreamToReadableStream(stream: Readable) {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}
