"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts } from "@/lib/post-attachments";
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

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteBriefItem(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!id || !jobId) return;
  const { count } = await prisma.briefItem.deleteMany({
    where: { jobId, groupId: id, context: "BRIEF" },
  });
  if (count === 0) {
    await prisma.briefItem.deleteMany({ where: { jobId, id, context: "BRIEF" } });
  }
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
  const { count } = await prisma.timelinePost.deleteMany({
    where: { jobId, groupId: id },
  });
  if (count === 0) {
    await prisma.timelinePost.deleteMany({ where: { jobId, id } });
  }
  revalidatePath(`/jobs/${jobId}`);
}
