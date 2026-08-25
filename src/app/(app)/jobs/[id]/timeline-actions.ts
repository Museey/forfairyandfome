"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts } from "@/lib/post-attachments";
import { notifyOtherUsers } from "@/lib/push";
import { deleteFile } from "@/lib/storage";
import type { BriefItemType, TimelinePostType } from "@/generated/prisma/enums";

export async function addBriefItem(formData: FormData) {
  const user = await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;

  const resolved = await resolvePosts(formData, `briefs/${jobId}`);
  if (resolved.length === 0) return;

  const groupId = crypto.randomUUID();
  await prisma.briefItem.createMany({
    data: resolved.map((item) => ({
      jobId,
      authorId: user.id,
      type: item.kind as BriefItemType,
      content: item.body,
      fileUrl: item.url,
      groupId,
      context: "BRIEF",
    })),
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  await notifyOtherUsers(user.id, {
    title: job ? `${job.brandName} · ${job.title}` : "บรีฟจากลูกค้า",
    body: `${user.name} แปะบรีฟจากลูกค้า`,
    url: `/jobs/${jobId}`,
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteBriefItem(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!id || !jobId) return;

  let items = await prisma.briefItem.findMany({
    where: { jobId, groupId: id, context: "BRIEF" },
  });
  if (items.length === 0) {
    items = await prisma.briefItem.findMany({ where: { jobId, id, context: "BRIEF" } });
  }

  await prisma.briefItem.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
  await Promise.all(items.filter((i) => i.fileUrl).map((i) => deleteFile(i.fileUrl!)));

  revalidatePath(`/jobs/${jobId}`);
}

export async function addTimelinePost(formData: FormData) {
  const user = await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;

  const resolved = await resolvePosts(formData, `timeline/${jobId}`);
  if (resolved.length === 0) return;

  const groupId = crypto.randomUUID();
  await prisma.timelinePost.createMany({
    data: resolved.map((item) => ({
      jobId,
      authorId: user.id,
      type: item.kind as TimelinePostType,
      body: item.body,
      attachmentUrl: item.kind === "LINK" ? null : item.url,
      linkUrl: item.kind === "LINK" ? item.url : null,
      groupId,
    })),
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteTimelinePost(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!id || !jobId) return;

  let items = await prisma.timelinePost.findMany({ where: { jobId, groupId: id } });
  if (items.length === 0) {
    items = await prisma.timelinePost.findMany({ where: { jobId, id } });
  }

  await prisma.timelinePost.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
  await Promise.all(
    items.filter((i) => i.attachmentUrl).map((i) => deleteFile(i.attachmentUrl!)),
  );

  revalidatePath(`/jobs/${jobId}`);
}
