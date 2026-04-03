import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isSuperAdmin(currentUser?.role)) {
    return NextResponse.json({ error: "Only the main admin can add members." }, { status: 403 });
  }

  const currentMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: session.user.id,
      },
    },
  });

  if (!currentMembership || currentMembership.role !== "admin") {
    return NextResponse.json({ error: "Only the main admin can invite members." }, { status: 403 });
  }

  try {
    const body = inviteMemberSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Ask them to register before inviting them." },
        { status: 404 },
      );
    }

    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        groupId: id,
        userId: user.id,
        role: "member",
      },
    });

    return NextResponse.json({ message: "Member added to the group." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not invite member.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
