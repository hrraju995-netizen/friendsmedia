import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ensureGroupFolders, uploadSmallFile } from "@/lib/drive";
import { sanitizeFileName, sha256 } from "@/lib/file-utils";
import { optimizeImageForUpload } from "@/lib/image-optimizer";
import { MEDIA_CATEGORIES_CONFIG_KEY, parseMediaCategoriesValue, parseMediaCategory } from "@/lib/media-categories";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertAllowedMimeType, assertMagicBytes, validateImage, validateVideo } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertRateLimit(`upload:${session.user.id}`);

    const formData = await request.formData();
    const groupId = String(formData.get("groupId") || "");
    const categoryConfig = await prisma.appConfig.findUnique({
      where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
    });
    const allowedCategories = parseMediaCategoriesValue(categoryConfig?.value);
    const category = parseMediaCategory(String(formData.get("category") || ""), allowedCategories);
    const fileEntries = formData.getAll("files");
    const legacyFile = formData.get("file");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0 && legacyFile instanceof File && legacyFile.size > 0) {
      files.push(legacyFile);
    }

    if (files.length === 0) {
      throw new Error("At least one file is required.");
    }

    if (files.length > 20) {
      throw new Error("You can upload up to 20 files at once.");
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "You do not have access to this group." }, { status: 403 });
    }

    const folders = await ensureGroupFolders(groupId);
    const uploadedMedia = [];

    for (const file of files) {
      assertAllowedMimeType(file.type);
      if (file.type.startsWith("image/")) {
        validateImage(file);
      } else {
        validateVideo(file);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      assertMagicBytes(buffer, file.type);
      const preparedUpload = file.type.startsWith("image/")
        ? await optimizeImageForUpload({
            buffer,
            fileName: file.name,
            mimeType: file.type,
          })
        : {
            buffer,
            fileName: file.name,
            mimeType: file.type,
            outputSize: file.size,
          };

      const fileName = sanitizeFileName(preparedUpload.fileName);
      const mediaType = preparedUpload.mimeType.startsWith("image/") ? "image" : "video";
      const driveFile = await uploadSmallFile({
        buffer: preparedUpload.buffer,
        fileName,
        mimeType: preparedUpload.mimeType,
        folderId: mediaType === "image" ? folders.imagesFolderId : folders.videosFolderId,
      });

      const media = await prisma.media.create({
        data: {
          uploaderId: session.user.id,
          groupId,
          category,
          driveFileId: driveFile.id!,
          fileName,
          mimeType: preparedUpload.mimeType,
          size: preparedUpload.outputSize,
          mediaType,
          checksum: sha256(preparedUpload.buffer),
        },
      });

      uploadedMedia.push(media);
    }

    const fileLabel = uploadedMedia.length === 1 ? "file" : "files";
    return NextResponse.json(
      {
        message: `${uploadedMedia.length} ${fileLabel} uploaded successfully.`,
        media: uploadedMedia,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
