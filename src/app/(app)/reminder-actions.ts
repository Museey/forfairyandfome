"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts } from "@/lib/post-attachments";
import { notifyOtherUsers } from "@/lib/push";
import type { BriefItemType } from "@/generated/prisma/enums";

// Each user has at most one active reminder — posting a new one replaces
// their previous one rather than adding to a history.
export async function addReminder(formData: FormData) {
  const user = await requireCurrentUser();

  const resolved = await resolvePosts(formData, "reminders");
  if (resolved.length === 0) return;

  const groupId = crypto.randomUUID();
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { authorId: user.id } }),
    prisma.reminder.createMany({
      data: resolved.map((item) => ({
        authorId: user.id,
        type: item.kind as BriefItemType,
        content: item.body,
        fileUrl: item.url,
        groupId,
      })),
    }),
  ]);

  await notifyOtherUsers(user.id, {
    title: "เตือนความจำ",
    body: `${user.name} อัปเดตเตือนความจำ`,
    url: "/",
  });

  revalidatePath("/");
}

export async function clearReminder() {
  const user = await requireCurrentUser();
  await prisma.reminder.deleteMany({ where: { authorId: user.id } });
  revalidatePath("/");
}
