import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteDriveFile, ensureProfilePhotosFolder, uploadSmallFile } from "@/lib/drive";
import { sanitizeFileName } from "@/lib/file-utils";
import { optimizeImageForUpload } from "@/lib/image-optimizer";
import { prisma } from "@/lib/prisma";
import { getPrismaApiError } from "@/lib/prisma-errors";
import { assertMagicBytes, validateImage } from "@/lib/validations";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const nextName = String(formData.get("name") || "").trim();
    const image = formData.get("image");
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");

    if (nextName.length < 2 || nextName.length > 80) {
      return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, password: true },
    });

    let nextImage = currentUser?.image ?? null;
    let nextPassword = currentUser?.password ?? null;

    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed for profile photos." }, { status: 400 });
      }

      validateImage(image);
      const buffer = Buffer.from(await image.arrayBuffer());
      assertMagicBytes(buffer, image.type);
      const optimizedAvatar = await optimizeImageForUpload({
        buffer,
        fileName: image.name,
        mimeType: image.type,
      });

      const folderId = await ensureProfilePhotosFolder();
      const uploaded = await uploadSmallFile({
        buffer: optimizedAvatar.buffer,
        fileName: sanitizeFileName(optimizedAvatar.fileName),
        mimeType: optimizedAvatar.mimeType,
        folderId,
      });

      nextImage = uploaded.id ?? null;

      if (currentUser?.image && !currentUser.image.startsWith("http") && currentUser.image !== nextImage) {
        try {
          await deleteDriveFile(currentUser.image);
        } catch {
          // Keep the new avatar even if the previous one could not be removed.
        }
      }
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      }

      if (!currentUser?.password) {
        return NextResponse.json({ error: "Current password could not be verified." }, { status: 400 });
      }

      if (!currentPassword) {
        return NextResponse.json({ error: "Enter your current password to set a new one." }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      nextPassword = await bcrypt.hash(newPassword, 12);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: nextName,
        image: nextImage,
        password: nextPassword,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully." });
  } catch (error) {
    const apiError = getPrismaApiError(error, "Could not update your profile.");
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
