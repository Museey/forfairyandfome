"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { DOCUMENT_TYPE_LABEL, parseLineItems, stripNullBytes } from "@/lib/document";
import { nextDocNumber } from "@/lib/doc-number";
import { notifyOtherUsers } from "@/lib/push";
import { deleteFile, uploadFile } from "@/lib/storage";
import type { DocumentType, DocumentStatus } from "@/generated/prisma/enums";

function optionalField(formData: FormData, key: string) {
  return stripNullBytes(String(formData.get(key) || "")).trim() || null;
}

export async function createDocument(formData: FormData) {
  await requireCurrentUser();
  const jobId = String(formData.get("jobId") || "");
  const type = String(formData.get("type") || "QUOTATION") as DocumentType;
  const issueDate = String(formData.get("issueDate") || "");
  const lineItemsRaw = String(formData.get("lineItems") || "[]");
  const withholdingTaxPercent = Number(formData.get("withholdingTaxPercent")) || 0;

  const lineItems = parseLineItems(JSON.parse(lineItemsRaw));
  const date = issueDate ? new Date(issueDate) : new Date();

  const doc = await prisma.document.create({
    data: {
      jobId,
      type,
      docNumber: await nextDocNumber(type, date),
      issueDate: date,
      buyerName: stripNullBytes(String(formData.get("buyerName") || "")).trim(),
      buyerAddress: optionalField(formData, "buyerAddress"),
      buyerTaxId: optionalField(formData, "buyerTaxId"),
      buyerContactName: optionalField(formData, "buyerContactName"),
      buyerPhone: optionalField(formData, "buyerPhone"),
      buyerEmail: optionalField(formData, "buyerEmail"),
      lineItems,
      withholdingTaxPercent,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}/documents/${doc.id}`);
}

export async function updateDocument(formData: FormData) {
  await requireCurrentUser();
  const docId = String(formData.get("docId") || "");
  const jobId = String(formData.get("jobId") || "");
  const issueDate = String(formData.get("issueDate") || "");
  const lineItemsRaw = String(formData.get("lineItems") || "[]");
  const withholdingTaxPercent = Number(formData.get("withholdingTaxPercent")) || 0;

  const lineItems = parseLineItems(JSON.parse(lineItemsRaw));
  const date = issueDate ? new Date(issueDate) : new Date();

  await prisma.document.update({
    where: { id: docId },
    data: {
      issueDate: date,
      buyerName: stripNullBytes(String(formData.get("buyerName") || "")).trim(),
      buyerAddress: optionalField(formData, "buyerAddress"),
      buyerTaxId: optionalField(formData, "buyerTaxId"),
      buyerContactName: optionalField(formData, "buyerContactName"),
      buyerPhone: optionalField(formData, "buyerPhone"),
      buyerEmail: optionalField(formData, "buyerEmail"),
      lineItems,
      withholdingTaxPercent,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/jobs/${jobId}/documents/${docId}`);
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}/documents/${docId}`);
}

export async function updateDocumentStatus(
  docId: string,
  jobId: string,
  status: DocumentStatus,
) {
  const user = await requireCurrentUser();
  const doc = await prisma.document.update({ where: { id: docId }, data: { status } });

  if (status === "PAID") {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job && job.status !== "PAID") {
      await prisma.job.update({ where: { id: jobId }, data: { status: "PAID" } });
    }
  }

  if (status === "SENT") {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    await notifyOtherUsers(user.id, {
      title: job ? `${job.brandName} · ${job.title}` : DOCUMENT_TYPE_LABEL[doc.type],
      body: `${user.name} ส่ง${DOCUMENT_TYPE_LABEL[doc.type]}แล้ว`,
      url: `/jobs/${jobId}/documents/${docId}`,
    });
  }

  revalidatePath("/documents");
  revalidatePath(`/jobs/${jobId}/documents/${docId}`);
  revalidatePath(`/jobs/${jobId}`);
}

export async function duplicateDocumentAs(
  docId: string,
  jobId: string,
  newType: DocumentType,
) {
  await requireCurrentUser();
  const source = await prisma.document.findUnique({ where: { id: docId } });
  if (!source) return;

  const date = new Date();
  const doc = await prisma.document.create({
    data: {
      jobId,
      type: newType,
      docNumber: await nextDocNumber(newType, date),
      issueDate: date,
      buyerName: stripNullBytes(source.buyerName),
      buyerAddress: source.buyerAddress ? stripNullBytes(source.buyerAddress) : null,
      buyerTaxId: source.buyerTaxId ? stripNullBytes(source.buyerTaxId) : null,
      buyerContactName: source.buyerContactName ? stripNullBytes(source.buyerContactName) : null,
      buyerPhone: source.buyerPhone ? stripNullBytes(source.buyerPhone) : null,
      buyerEmail: source.buyerEmail ? stripNullBytes(source.buyerEmail) : null,
      lineItems: source.lineItems as never,
      withholdingTaxPercent: source.withholdingTaxPercent,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}/documents/${doc.id}`);
}

export async function deleteDocument(formData: FormData) {
  await requireCurrentUser();
  const docId = String(formData.get("docId") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!docId) return;

  const doc = await prisma.document.delete({ where: { id: docId } });
  if (doc.signedFileUrl) await deleteFile(doc.signedFileUrl);

  revalidatePath("/documents");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?tab=documents`);
}

/**
 * Attach the scan of the signed copy. The draft is rendered on demand from
 * the document's fields, so this is the only file we keep for a document —
 * replacing an existing scan deletes the old one rather than orphaning it.
 */
export async function attachSignedCopy(formData: FormData) {
  await requireCurrentUser();
  const docId = String(formData.get("docId") || "");
  const file = formData.get("file");
  if (!docId || !(file instanceof File) || file.size === 0) return;

  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing) return;

  const url = await uploadFile(file, `documents/${docId}`);
  await prisma.document.update({
    where: { id: docId },
    data: { signedFileUrl: url, signedAt: new Date() },
  });
  if (existing.signedFileUrl) await deleteFile(existing.signedFileUrl);

  revalidatePath("/documents");
  revalidatePath(`/jobs/${existing.jobId}`);
  revalidatePath(`/jobs/${existing.jobId}/documents/${docId}`);
}

export async function removeSignedCopy(formData: FormData) {
  await requireCurrentUser();
  const docId = String(formData.get("docId") || "");
  if (!docId) return;

  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing?.signedFileUrl) return;

  await prisma.document.update({
    where: { id: docId },
    data: { signedFileUrl: null, signedAt: null },
  });
  await deleteFile(existing.signedFileUrl);

  revalidatePath("/documents");
  revalidatePath(`/jobs/${existing.jobId}`);
  revalidatePath(`/jobs/${existing.jobId}/documents/${docId}`);
}
