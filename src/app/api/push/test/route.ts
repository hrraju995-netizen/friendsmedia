import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/web-push";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptionCount = await prisma.pushSubscription.count({
    where: {
      userId: session.user.id,
    },
  });

  if (subscriptionCount === 0) {
    return NextResponse.json(
      { error: "No phone alert subscription found on this device yet." },
      { status: 400 },
    );
  }

  await sendPushToUsers([session.user.id], {
    title: "Friends Media test alert",
    body: "Phone alerts are connected for this account.",
    url: "/gallery",
    tag: `test-${Date.now()}`,
  });

  return NextResponse.json({ ok: true });
}
