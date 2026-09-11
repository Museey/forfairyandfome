"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { parseLineItems, stripNullBytes } from "@/lib/document";
import { parseTimesheetRows } from "@/lib/payroll";
import { seedTimesheetRows } from "@/lib/timesheet-seed";
import { nextDocNumber } from "@/lib/doc-number";
import { deleteFile, uploadFile } from "@/lib/storage";
import { TAX_DOC_PERIOD } from "@/lib/tax-document";
import { bangkokYearMonth } from "@/lib/timezone";
import type { DocumentStatus, TaxDocType } from "@/generated/prisma/enums";

function text(formData: FormData, key: string) {
  return stripNullBytes(String(formData.get(key) || "")).trim();
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

/** The period a payslip/timesheet covers, read from a "YYYY-MM" month input. */
function period(formData: FormData) {
  const [year, month] = text(formData, "period").split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** The 1st of the period, which is what the running number is dated from. */
function periodDate(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

// ---------------------------------------------------------------- payslip

export async function createPayslip(formData: FormData) {
  await requireCurrentUser();
  const at = period(formData);
  if (!at) return;

  // One payslip per month. Landing on the existing one beats a unique-
  // constraint crash when a month is picked that's already been issued.
  const existing = await prisma.payslip.findUnique({
    where: { periodYear_periodMonth: { periodYear: at.year, periodMonth: at.month } },
  });
  if (existing) redirect(`/documents/payslips/${existing.id}`);

  const payslip = await prisma.payslip.create({
    data: {
      docNumber: await nextDocNumber("PAYSLIP", periodDate(at.year, at.month)),
      periodYear: at.year,
      periodMonth: at.month,
      employeeName: text(formData, "employeeName"),
      position: optional(formData, "position"),
      paymentDate: new Date(text(formData, "paymentDate") || Date.now()),
      earnings: parseLineItems(JSON.parse(String(formData.get("earnings") || "[]"))),
      deductions: parseLineItems(JSON.parse(String(formData.get("deductions") || "[]"))),
      note: optional(formData, "note"),
      status: (text(formData, "status") || "DRAFT") as DocumentStatus,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/payslips/${payslip.id}`);
}

export async function updatePayslip(formData: FormData) {
  await requireCurrentUser();
  const id = text(formData, "id");
  const at = period(formData);
  if (!id || !at) return;

  await prisma.payslip.update({
    where: { id },
    data: {
      periodYear: at.year,
      periodMonth: at.month,
      employeeName: text(formData, "employeeName"),
      position: optional(formData, "position"),
      paymentDate: new Date(text(formData, "paymentDate") || Date.now()),
      earnings: parseLineItems(JSON.parse(String(formData.get("earnings") || "[]"))),
      deductions: parseLineItems(JSON.parse(String(formData.get("deductions") || "[]"))),
      note: optional(formData, "note"),
      status: (text(formData, "status") || "DRAFT") as DocumentStatus,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/payslips/${id}`);
}

export async function deletePayslip(formData: FormData) {
  await requireCurrentUser();
  const id = text(formData, "id");
  if (!id) return;
  await prisma.payslip.delete({ where: { id } });
  revalidatePath("/documents");
  redirect("/documents?tab=payslips");
}

// -------------------------------------------------------------- timesheet

/**
 * Rebuilds the rows from the month's check-ins. Called when the period
 * changes on the form, so the grid follows the month being filled in rather
 * than only the one it was opened on.
 */
export async function timesheetRowsFromCheckIns(periodValue: string) {
  await requireCurrentUser();
  const [year, month] = periodValue.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return [];

  const employee = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  if (!employee) return [];

  return seedTimesheetRows(employee.id, year, month);
}

export async function createTimesheet(formData: FormData) {
  await requireCurrentUser();
  const at = period(formData);
  if (!at) return;

  // Same as payslips: one per month, existing one wins over a crash.
  const existing = await prisma.timesheet.findUnique({
    where: { periodYear_periodMonth: { periodYear: at.year, periodMonth: at.month } },
  });
  if (existing) redirect(`/documents/timesheets/${existing.id}`);

  const timesheet = await prisma.timesheet.create({
    data: {
      docNumber: await nextDocNumber("TIMESHEET", periodDate(at.year, at.month)),
      periodYear: at.year,
      periodMonth: at.month,
      employeeName: text(formData, "employeeName"),
      position: optional(formData, "position"),
      rows: parseTimesheetRows(JSON.parse(String(formData.get("rows") || "[]"))),
      ratePerHour: Number(formData.get("ratePerHour")) || null,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/timesheets/${timesheet.id}`);
}

export async function updateTimesheet(formData: FormData) {
  await requireCurrentUser();
  const id = text(formData, "id");
  const at = period(formData);
  if (!id || !at) return;

  await prisma.timesheet.update({
    where: { id },
    data: {
      periodYear: at.year,
      periodMonth: at.month,
      employeeName: text(formData, "employeeName"),
      position: optional(formData, "position"),
      rows: parseTimesheetRows(JSON.parse(String(formData.get("rows") || "[]"))),
      ratePerHour: Number(formData.get("ratePerHour")) || null,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/timesheets/${id}`);
}

export async function deleteTimesheet(formData: FormData) {
  await requireCurrentUser();
  const id = text(formData, "id");
  if (!id) return;
  await prisma.timesheet.delete({ where: { id } });
  revalidatePath("/documents");
  redirect("/documents?tab=timesheets");
}

// ----------------------------------------------------------- tax document

/**
 * Files a scan of one of the four tax forms. What identifies the filing
 * depends on the form: WHT hangs off a job, ภ.พ.30 and ภาษีซื้อ-ขาย off a
 * month, ภ.ง.ด.90 off a year.
 */
export async function uploadTaxDocument(formData: FormData) {
  const user = await requireCurrentUser();
  const type = text(formData, "type") as TaxDocType;
  const file = formData.get("file");
  if (!TAX_DOC_PERIOD[type] || !(file instanceof File) || file.size === 0) return;

  const scope = TAX_DOC_PERIOD[type];
  const jobId = scope === "JOB" ? optional(formData, "jobId") : null;
  if (scope === "JOB" && !jobId) return;

  let periodYear: number;
  let periodMonth: number | null = null;

  if (scope === "MONTH") {
    const at = period(formData);
    if (!at) return;
    periodYear = at.year;
    periodMonth = at.month;
  } else if (scope === "YEAR") {
    periodYear = Number(text(formData, "periodYear"));
    if (!Number.isInteger(periodYear)) return;
  } else {
    // WHT is dated by when it was filed; the job is what identifies it.
    const now = bangkokYearMonth(new Date());
    periodYear = now.year;
    periodMonth = now.month;
  }

  const url = await uploadFile(file, `tax/${type.toLowerCase()}`);
  await prisma.taxDocument.create({
    data: {
      type,
      jobId,
      periodYear,
      periodMonth,
      fileUrl: url,
      note: optional(formData, "note"),
      uploadedById: user.id,
    },
  });

  revalidatePath("/documents");
  if (jobId) revalidatePath(`/jobs/${jobId}`);
}

export async function deleteTaxDocument(formData: FormData) {
  await requireCurrentUser();
  const id = text(formData, "id");
  if (!id) return;

  const doc = await prisma.taxDocument.delete({ where: { id } });
  await deleteFile(doc.fileUrl);

  revalidatePath("/documents");
  if (doc.jobId) revalidatePath(`/jobs/${doc.jobId}`);
}
