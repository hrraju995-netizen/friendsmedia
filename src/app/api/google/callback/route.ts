import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import { getGoogleOAuthClient, setStoredRefreshToken } from "@/lib/drive-auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/gallery?drive=error", env.AUTH_URL));
  }

  try {
    const client = await getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);

    if (tokens.refresh_token) {
      await setStoredRefreshToken(tokens.refresh_token);
    }

    return NextResponse.redirect(new URL("/gallery?drive=connected", env.AUTH_URL));
  } catch {
    return NextResponse.redirect(new URL("/gallery?drive=error", env.AUTH_URL));
  }
}
