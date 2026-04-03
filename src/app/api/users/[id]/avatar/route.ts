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
  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  const user = await prisma.user.findFirst({
    where: {
      id,
      image: {
        not: null,
      },
      memberships: {
        some: {
          groupId: {
            in: memberships.map((membership) => membership.groupId),
          },
        },
      },
    },
    select: {
      image: true,
      name: true,
    },
  });

  if (!user?.image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [stream, metadata] = await Promise.all([
    streamDriveFile(user.image),
    getDriveFileMetadata(user.image),
  ]);

  return new NextResponse(nodeStreamToReadableStream(stream), {
    status: 200,
    headers: {
      "Content-Type": metadata.mimeType || "image/jpeg",
      "Content-Disposition": `inline; filename="${metadata.name || user.name || "avatar"}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
