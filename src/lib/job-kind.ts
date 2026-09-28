import { prisma } from "@/lib/prisma";
import { JOB_STATUS_ORDER } from "@/lib/job-status";
import { JobKind, type JobStatus } from "@/generated/prisma/enums";

export const JOB_KIND_ORDER: JobKind[] = [JobKind.STANDARD, JobKind.FREE];

export const JOB_KIND_LABEL: Record<JobKind, string> = {
  STANDARD: "งานปกติ",
  FREE: "งานฟรี",
};

export const JOB_KIND_HINT: Record<JobKind, string> = {
  STANDARD: "มีค่าจ้าง ออกเอกสารได้ตามปกติ",
  FREE: "ไม่ได้เงิน ไม่ต้องทำเอกสาร",
};

export function parseJobKind(value: FormDataEntryValue | null): JobKind {
  return value === JobKind.FREE ? JobKind.FREE : JobKind.STANDARD;
}

/** A free job is never paid, so it has no ได้รับเงินแล้ว step. */
export function jobStatusesFor(kind: JobKind): JobStatus[] {
  return kind === JobKind.FREE
    ? JOB_STATUS_ORDER.filter((s) => s !== "PAID")
    : JOB_STATUS_ORDER;
}

/** Whether a job still has work left: a free job is done once posted. */
export function isJobActive(kind: JobKind, status: JobStatus) {
  if (status === "PAID") return false;
  return !(kind === JobKind.FREE && status === "POSTED");
}

/** Throws unless the job exists and is one that takes documents. */
export async function assertJobTakesDocuments(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { kind: true },
  });
  if (!job) throw new Error("ไม่พบงานนี้");
  if (job.kind === JobKind.FREE) {
    throw new Error("งานฟรีไม่ต้องทำเอกสาร");
  }
}
