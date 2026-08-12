"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts } from "@/lib/post-attachments";
import { notifyOtherUsers } from "@/lib/push";
import type { BriefItemType } from "@/generated/prisma/enums";

export async function addReminder(formData: FormData) {
  const user = await requireCurrentUser();

  const resolved = await resolvePosts(formData, "reminders");
  if (resolved.length === 0) return;

  const groupId = crypto.randomUUID();
  await prisma.reminder.createMany({
    data: resolved.map((item) => ({
      authorId: user.id,
      type: item.kind as BriefItemType,
      content: item.body,
      fileUrl: item.url,
      groupId,
    })),
  });

  await notifyOtherUsers(user.id, {
    title: "เตือนความจำ",
    body: `${user.name} ฝากเตือนความจำ`,
    url: "/",
  });

  revalidatePath("/");
}

export async function deleteReminder(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { count } = await prisma.reminder.deleteMany({
    where: { groupId: id },
  });
  if (count === 0) {
    await prisma.reminder.deleteMany({ where: { id } });
  }
  revalidatePath("/");
}
