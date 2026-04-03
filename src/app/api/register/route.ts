import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { ensureSharedGroup } from "@/lib/community";
import { getPrismaApiError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        { error: "Public registration is closed. Ask the main admin to create your account." },
        { status: 403 },
      );
    }

    const body = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    const password = await bcrypt.hash(body.password, 12);

    await prisma.$transaction(async (tx) => {
      const sharedGroup = await ensureSharedGroup(tx);
      const userRole = "super_admin";

      await tx.user.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          password,
          role: userRole,
          memberships: {
            create: {
              groupId: sharedGroup.id,
              role: userRole === "super_admin" ? "admin" : "member",
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
  } catch (error) {
    const apiError = getPrismaApiError(error, "Registration failed.");
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
