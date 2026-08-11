"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { notifyOtherUsers } from "@/lib/push";
import type { JobStatus } from "@/generated/prisma/enums";

export async function createJob(formData: FormData) {
  const user = await requireCurrentUser();
  const title = String(formData.get("title") || "").trim();
  const brandName = String(formData.get("brandName") || "").trim();
  const productName = String(formData.get("productName") || "").trim();

  if (!title || !brandName) {
    throw new Error("กรุณากรอกชื่องานและแบรนด์");
  }

  const job = await prisma.job.create({
    data: {
      title,
      brandName,
      productName: productName || null,
      createdById: user.id,
    },
  });

  await notifyOtherUsers(user.id, {
    title: `${job.brandName} · ${job.title}`,
    body: `${user.name} เพิ่มงานใหม่`,
    url: `/jobs/${job.id}`,
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  await requireCurrentUser();
  await prisma.job.update({ where: { id: jobId }, data: { status } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

function toDateOrNull(value: FormDataEntryValue | null) {
  const str = String(value || "").trim();
  return str ? new Date(str) : null;
}

export async function updateJobDates(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) throw new Error("missing jobId");

  await prisma.job.update({
    where: { id: jobId },
    data: {
      storylineSendDate: toDateOrNull(formData.get("storylineSendDate")),
      shootDate: toDateOrNull(formData.get("shootDate")),
      draftSendDate: toDateOrNull(formData.get("draftSendDate")),
      postDate: toDateOrNull(formData.get("postDate")),
    },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function updateJobInfo(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  const title = String(formData.get("title") || "").trim();
  const brandName = String(formData.get("brandName") || "").trim();
  const productName = String(formData.get("productName") || "").trim();
  if (!jobId || !title || !brandName) throw new Error("missing fields");

  await prisma.job.update({
    where: { id: jobId },
    data: { title, brandName, productName: productName || null },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function deleteJob(jobId: string) {
  await requireCurrentUser();
  await prisma.job.delete({ where: { id: jobId } });
  revalidatePath("/jobs");
}
