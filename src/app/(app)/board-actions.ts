"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts, type ResolvedPost } from "@/lib/post-attachments";
import { notifyOtherUsers } from "@/lib/push";
import { deleteFile } from "@/lib/storage";
import {
  BOARD_TOPIC_KEEPS_HISTORY,
  BOARD_TOPIC_LABEL,
  canPostToTopic,
} from "@/lib/board";
import type { BoardTopic, BriefItemType } from "@/generated/prisma/enums";

const NOTIFICATION_BODY_LIMIT = 180;

/** Prefer the posted text in the notification; fall back to what was attached. */
function notificationBody(resolved: ResolvedPost[]) {
  const text = resolved.find((r) => r.kind === "TEXT")?.body?.trim();
  if (text) {
    return text.length > NOTIFICATION_BODY_LIMIT
      ? `${text.slice(0, NOTIFICATION_BODY_LIMIT)}…`
      : text;
  }

  const counts = {
    PHOTO: resolved.filter((r) => r.kind === "PHOTO").length,
    FILE: resolved.filter((r) => r.kind === "FILE").length,
    LINK: resolved.filter((r) => r.kind === "LINK").length,
  };
  const parts = [
    counts.PHOTO ? `${counts.PHOTO} รูป` : null,
    counts.FILE ? `${counts.FILE} ไฟล์` : null,
    counts.LINK ? `${counts.LINK} ลิงก์` : null,
  ].filter(Boolean);
  return parts.length > 0 ? `ส่ง${parts.join(" · ")}` : "มีข้อความใหม่";
}

export async function addBoardPost(topic: BoardTopic, formData: FormData) {
  const user = await requireCurrentUser();
  if (!canPostToTopic(topic, user.role)) return;

  const resolved = await resolvePosts(formData, `board/${topic.toLowerCase()}`);
  if (resolved.length === 0) return;

  const groupId = crypto.randomUUID();
  const create = prisma.boardPost.createMany({
    data: resolved.map((item) => ({
      topic,
      authorId: user.id,
      type: item.kind as BriefItemType,
      content: item.body,
      fileUrl: item.url,
      groupId,
    })),
  });

  if (BOARD_TOPIC_KEEPS_HISTORY[topic]) {
    await create;
  } else {
    // Reminder keeps a single active post per author — replace the old one.
    const previous = await prisma.boardPost.findMany({
      where: { topic, authorId: user.id },
    });
    await prisma.$transaction([
      prisma.boardPost.deleteMany({ where: { topic, authorId: user.id } }),
      create,
    ]);
    await Promise.all(
      previous.filter((p) => p.fileUrl).map((p) => deleteFile(p.fileUrl!)),
    );
  }

  await notifyOtherUsers(user.id, {
    title: `${BOARD_TOPIC_LABEL[topic]} จาก ${user.name}`,
    body: notificationBody(resolved),
    url: "/",
  });

  revalidatePath("/");
}

export async function deleteBoardPost(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  if (!id) return;

  // Composer posts are grouped by groupId; PostItem hands back that group id.
  let posts = await prisma.boardPost.findMany({ where: { groupId: id } });
  if (posts.length === 0) {
    posts = await prisma.boardPost.findMany({ where: { id } });
  }

  await prisma.boardPost.deleteMany({ where: { id: { in: posts.map((p) => p.id) } } });
  await Promise.all(
    posts.filter((p) => p.fileUrl).map((p) => deleteFile(p.fileUrl!)),
  );

  revalidatePath("/");
}

export async function addReminder(formData: FormData) {
  await addBoardPost("REMINDER", formData);
}

export async function addContent(formData: FormData) {
  await addBoardPost("CONTENT", formData);
}

export async function addSlip(formData: FormData) {
  await addBoardPost("SLIP", formData);
}
