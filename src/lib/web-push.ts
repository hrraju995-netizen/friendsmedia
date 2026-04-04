import webpush from "web-push";

import { env, isWebPushConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (!isWebPushConfigured()) {
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(env.WEB_PUSH_SUBJECT, env.WEB_PUSH_PUBLIC_KEY, env.WEB_PUSH_PRIVATE_KEY);
    vapidConfigured = true;
  }

  return true;
}

export function getWebPushPublicKey() {
  return isWebPushConfigured() ? env.WEB_PUSH_PUBLIC_KEY : "";
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureVapidConfigured() || userIds.length === 0) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const serializedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/moments",
    tag: payload.tag || "friends-media-upload",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [140, 80, 140],
  });

  const staleEndpoints: string[] = [];
  const deliveredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          serializedPayload,
          {
            TTL: 60,
          },
        );
        deliveredEndpoints.push(subscription.endpoint);
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;

        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
        }
      }
    }),
  );

  await Promise.all([
    staleEndpoints.length > 0
      ? prisma.pushSubscription.deleteMany({
          where: {
            endpoint: {
              in: staleEndpoints,
            },
          },
        })
      : Promise.resolve(),
    deliveredEndpoints.length > 0
      ? prisma.pushSubscription.updateMany({
          where: {
            endpoint: {
              in: deliveredEndpoints,
            },
          },
          data: {
            lastUsedAt: new Date(),
          },
        })
      : Promise.resolve(),
  ]);
}
