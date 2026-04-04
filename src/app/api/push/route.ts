import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isWebPushConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getWebPushPublicKey } from "@/lib/web-push";

type PushSubscriptionPayload = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    enabled: isWebPushConfigured(),
    publicKey: getWebPushPublicKey(),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: "Web push is not configured yet." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as PushSubscriptionPayload;
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint : "";
  const p256dh = typeof payload.keys?.p256dh === "string" ? payload.keys.p256dh : "";
  const authKey = typeof payload.keys?.auth === "string" ? payload.keys.auth : "";

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid push subscription payload." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: {
      endpoint,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get("user-agent"),
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { endpoint?: unknown };
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint : "";

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      endpoint,
    },
  });

  return NextResponse.json({ ok: true });
}
