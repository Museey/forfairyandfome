import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

webpush.setVapidDetails(
  "mailto:admin@fairyandfome.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

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

export async function notifyOtherUsers(excludeUserId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { not: excludeUserId } },
  });
  await sendToSubscriptions(subscriptions, payload);
}

export async function notifyAllUsers(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany();
  await sendToSubscriptions(subscriptions, payload);
}

export async function notifyUsersByRole(
  role: Role,
  payload: PushPayload,
  excludeUserId?: string,
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      user: { role },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
  });
  await sendToSubscriptions(subscriptions, payload);
}
