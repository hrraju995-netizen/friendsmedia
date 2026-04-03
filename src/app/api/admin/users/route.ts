import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ensureSharedGroup, isSuperAdmin } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { getPrismaApiError } from "@/lib/prisma-errors";
import { adminCreateUserSchema } from "@/lib/validations";

export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Only the main admin can create users." }, { status: 403 });
    }

    const body = adminCreateUserSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }

    const password = await bcrypt.hash(body.password, 12);

    await prisma.$transaction(async (tx) => {
      const sharedGroup = await ensureSharedGroup(tx);

      await tx.user.create({
        data: {
          name: body.name,
          email,
          password,
          role: "member",
          memberships: {
            create: {
              groupId: sharedGroup.id,
              role: "member",
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "User account created successfully." }, { status: 201 });
  } catch (error) {
    const apiError = getPrismaApiError(error, "Could not create the user.");
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
