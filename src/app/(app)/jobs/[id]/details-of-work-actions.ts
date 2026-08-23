"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { notifyOtherUsers } from "@/lib/push";

function linesToBullets(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function detailsOfWorkFields(formData: FormData) {
  return {
    sow: String(formData.get("sow") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
    keyMessage: linesToBullets(formData.get("keyMessage")),
    doList: linesToBullets(formData.get("doList")),
    dontList: linesToBullets(formData.get("dontList")),
    moodTone: String(formData.get("moodTone") || "").trim() || null,
    dressCode: String(formData.get("dressCode") || "").trim() || null,
    hashtags: String(formData.get("hashtags") || "").trim() || null,
    otherNotes: String(formData.get("otherNotes") || "").trim() || null,
  };
}

export async function saveDetailsOfWorkDraft(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;

  const data = detailsOfWorkFields(formData);
  await prisma.detailsOfWork.upsert({
    where: { jobId },
    update: data,
    create: { jobId, ...data },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function saveDetailsOfWork(formData: FormData) {
  const user = await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;

  const data = detailsOfWorkFields(formData);
  await prisma.detailsOfWork.upsert({
    where: { jobId },
    update: data,
    create: { jobId, ...data },
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  await notifyOtherUsers(user.id, {
    title: job ? `${job.brandName} · ${job.title}` : "Details of Work",
    body: `${user.name} ส่ง Details of Work แล้ว`,
    url: `/jobs/${jobId}?tab=work`,
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function addProductImage(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  const file = formData.get("file");
  if (!jobId || !(file instanceof File) || file.size === 0) return;

  const url = await uploadFile(file, `product-images/${jobId}`);

  const existing = await prisma.detailsOfWork.findUnique({ where: { jobId } });
  const images = Array.isArray(existing?.productImages)
    ? (existing.productImages as string[])
    : [];

  await prisma.detailsOfWork.upsert({
    where: { jobId },
    update: { productImages: [...images, url] },
    create: { jobId, productImages: [url] },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function removeProductImage(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  const url = String(formData.get("url") || "");
  if (!jobId || !url) return;

  const existing = await prisma.detailsOfWork.findUnique({ where: { jobId } });
  const images = Array.isArray(existing?.productImages)
    ? (existing.productImages as string[])
    : [];

  await prisma.detailsOfWork.update({
    where: { jobId },
    data: { productImages: images.filter((i) => i !== url) },
  });

  revalidatePath(`/jobs/${jobId}`);
}
