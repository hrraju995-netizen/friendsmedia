import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDriveFileMetadata, nodeStreamToReadableStream, streamDriveFile } from "@/lib/drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const media = await prisma.media.findUnique({
    where: { id },
  });

  if (!media || media.deletedAt) {
    return new NextResponse("Not found", { status: 404 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: media.groupId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [stream, metadata] = await Promise.all([
    streamDriveFile(media.driveFileId),
    getDriveFileMetadata(media.driveFileId),
  ]);

  return new NextResponse(nodeStreamToReadableStream(stream), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Disposition": `attachment; filename="${metadata.name || media.fileName}"`,
      "Cache-Control": "private, max-age=120",
    },
  });
}
