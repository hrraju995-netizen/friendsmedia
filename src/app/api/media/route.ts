import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.groupMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      groupId: true,
    },
  });

  const media = await prisma.media.findMany({
    where: {
      groupId: {
        in: memberships.map((membership) => membership.groupId),
      },
      deletedAt: null,
    },
    include: {
      uploader: true,
      group: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ media });
}

