import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import { getGoogleOAuthClient } from "@/lib/drive-auth";
import { env, isDriveConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const scopes = ["https://www.googleapis.com/auth/drive"];

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", env.AUTH_URL));
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isSuperAdmin(currentUser?.role)) {
    return NextResponse.redirect(new URL("/gallery?drive=forbidden", env.AUTH_URL));
  }

  if (!isDriveConfigured()) {
    return NextResponse.json({ error: "Google Drive environment variables are missing." }, { status: 400 });
  }

  const client = await getGoogleOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
  });

  return NextResponse.redirect(url);
}
