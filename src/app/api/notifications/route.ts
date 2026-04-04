import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") || "8");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const ids = Array.isArray(payload?.ids) ? payload.ids.filter((value: unknown): value is string => typeof value === "string") : [];
  const markAll = payload?.markAll === true || ids.length === 0;

  await prisma.notification.updateMany({
    where: markAll
      ? {
          userId: session.user.id,
          isRead: false,
        }
      : {
          userId: session.user.id,
          id: {
            in: ids,
          },
        },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
