import webpush from "web-push";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

webpush.setVapidDetails(
  "mailto:admin@fairyandfome.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Without this a push service that accepts the connection but never answers
// hangs the request until the whole serverless function times out — which
// surfaces to whoever posted as a failed page load, even though their post
// was already saved.
const PUSH_TIMEOUT_MS = 5000;

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

async function sendToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
) {
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { timeout: PUSH_TIMEOUT_MS },
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}

/**
 * Delivering a notification is a side effect of an action that has already
 * succeeded, so it runs after the response and can never fail or delay it.
 */
async function sendAfterResponse(send: () => Promise<void>) {
  const guarded = async () => {
    try {
      await send();
    } catch {
      // A notification that doesn't arrive must not surface as a failed action.
    }
  };

  try {
    after(guarded);
  } catch {
    // No request to run after (scripts, seeds) — send inline instead, which
    // is still bounded by PUSH_TIMEOUT_MS.
    await guarded();
  }
}

export async function notifyOtherUsers(excludeUserId: string, payload: PushPayload) {
  await sendAfterResponse(async () => {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { not: excludeUserId } },
    });
    await sendToSubscriptions(subscriptions, payload);
  });
}

export async function notifyAllUsers(payload: PushPayload) {
  await sendAfterResponse(async () => {
    const subscriptions = await prisma.pushSubscription.findMany();
    await sendToSubscriptions(subscriptions, payload);
  });
}

export async function notifyUsersByRole(
  role: Role,
  payload: PushPayload,
  excludeUserId?: string,
) {
  await sendAfterResponse(async () => {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        user: { role },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
    });
    await sendToSubscriptions(subscriptions, payload);
  });
}
