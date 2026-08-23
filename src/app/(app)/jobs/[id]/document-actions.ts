"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { DOCUMENT_TYPE_LABEL, generateDocNumber, parseLineItems, stripNullBytes } from "@/lib/document";
import { notifyOtherUsers } from "@/lib/push";
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
      docNumber: generateDocNumber(type, date),
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
      docNumber: generateDocNumber(newType, date),
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

  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}/documents/${doc.id}`);
}

export async function deleteDocument(formData: FormData) {
  await requireCurrentUser();
  const docId = String(formData.get("docId") || "");
  const jobId = String(formData.get("jobId") || "");
  if (!docId) return;
  await prisma.document.delete({ where: { id: docId } });
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?tab=documents`);
}
