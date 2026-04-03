import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import { prisma } from "@/lib/prisma";

export async function POST() {
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
      return NextResponse.json({ error: "Only the main admin can manage the shared space." }, { status: 403 });
    }

    return NextResponse.json(
      { error: "This app uses one shared group. Creating additional groups is disabled." },
      { status: 409 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create group.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
