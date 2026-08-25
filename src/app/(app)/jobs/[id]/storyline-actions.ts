"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { resolvePosts } from "@/lib/post-attachments";
import { notifyOtherUsers } from "@/lib/push";
import { deleteFile } from "@/lib/storage";
import type { StorylineScene } from "@/lib/storyline";
import type { BriefItemType } from "@/generated/prisma/enums";

async function upsertScenes(jobId: string, scenes: StorylineScene[]) {
  return prisma.storyline.upsert({
    where: { jobId },
    update: { scenes },
    create: { jobId, scenes, status: "DRAFT" },
  });
}

export async function saveStorylineDraft(
  jobId: string,
  scenes: StorylineScene[],
) {
  await requireCurrentUser();
  await upsertScenes(jobId, scenes);
  revalidatePath(`/jobs/${jobId}`);
}

export async function sendStoryline(jobId: string, scenes: StorylineScene[]) {
  const user = await requireCurrentUser();

  await prisma.storyline.upsert({
    where: { jobId },
    update: { scenes, status: "SENT", sentAt: new Date() },
    create: { jobId, scenes, status: "SENT", sentAt: new Date() },
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (job?.status === "NEW") {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "WAITING_STORYLINE_APPROVAL" },
    });
  }

  await prisma.timelinePost.create({
    data: {
      jobId,
      authorId: user.id,
      type: "SYSTEM",
      body: `${user.name} ส่ง Storyline ให้ลูกค้าแล้ว`,
    },
  });

  const otherUser = await prisma.user.findFirst({ where: { id: { not: user.id } } });
  await notifyOtherUsers(user.id, {
    title: job ? `${job.brandName} · ${job.title}` : "Storyline",
    body: `${user.name} ส่ง Storyline ให้ ${otherUser?.name ?? "อีกฝ่าย"} แล้ว`,
    url: `/jobs/${jobId}?tab=storyline`,
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function approveStoryline(jobId: string) {
  const user = await requireCurrentUser();

  await prisma.storyline.update({
    where: { jobId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (job?.status === "WAITING_STORYLINE_APPROVAL") {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "SHOOTING" },
    });
  }

  await prisma.timelinePost.create({
    data: {
      jobId,
      authorId: user.id,
      type: "SYSTEM",
      body: `${user.name} อนุมัติ Storyline แล้ว`,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function addStorylineRevision(formData: FormData) {
  const user = await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;

  const resolved = await resolvePosts(formData, `storyline/${jobId}`);
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
      context: "STORYLINE",
    })),
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  await notifyOtherUsers(user.id, {
    title: job ? `${job.brandName} · ${job.title}` : "Storyline",
    body: `${user.name} แปะการแก้ไข Storyline จากลูกค้า`,
    url: `/jobs/${jobId}?tab=storyline`,
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteStorylineRevision(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!id || !jobId) return;

  let items = await prisma.briefItem.findMany({
    where: { jobId, groupId: id, context: "STORYLINE" },
  });
  if (items.length === 0) {
    items = await prisma.briefItem.findMany({ where: { jobId, id, context: "STORYLINE" } });
  }

  await prisma.briefItem.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
  await Promise.all(items.filter((i) => i.fileUrl).map((i) => deleteFile(i.fileUrl!)));
  revalidatePath(`/jobs/${jobId}`);
}
