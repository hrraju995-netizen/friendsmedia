import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteDriveFile } from "@/lib/drive";
import { isSuperAdmin } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { getPrismaApiError } from "@/lib/prisma-errors";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!isSuperAdmin(currentUser?.role)) {
      return NextResponse.json({ error: "Only the main admin can delete users." }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "The main admin account cannot be deleted here." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: {
        media: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            driveFileId: true,
          },
        },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    for (const media of target.media) {
      try {
        await deleteDriveFile(media.driveFileId);
      } catch {
        // Best-effort cleanup before account removal.
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    const apiError = getPrismaApiError(error, "Could not delete the user.");
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
