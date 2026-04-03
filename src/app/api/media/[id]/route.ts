import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteDriveFile } from "@/lib/drive";
import { prisma } from "@/lib/prisma";

async function getAccessibleMedia(userId: string, id: string) {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      group: true,
      uploader: true,
    },
  });

  if (!media || media.deletedAt) {
    return null;
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: media.groupId,
        userId,
      },
    },
  });

  if (!membership) {
    return null;
  }

  return { media, membership };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAccessibleMedia(session.user.id, id);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ media: result.media });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAccessibleMedia(session.user.id, id);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canDelete = result.media.uploaderId === session.user.id;

  if (!canDelete) {
    return NextResponse.json({ error: "You cannot delete this file." }, { status: 403 });
  }

  await prisma.media.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "deleted",
    },
  });

  try {
    await deleteDriveFile(result.media.driveFileId);
  } catch {
    await prisma.media.update({
      where: { id },
      data: {
        status: "delete_pending",
      },
    });
  }

  return NextResponse.json({ message: "Media deleted." });
}
