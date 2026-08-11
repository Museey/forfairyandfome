import { JobStatus } from "@/generated/prisma/enums";

export const JOB_STATUS_ORDER: JobStatus[] = [
  JobStatus.NEW,
  JobStatus.WAITING_STORYLINE_APPROVAL,
  JobStatus.SHOOTING,
  JobStatus.WAITING_DRAFT,
  JobStatus.DRAFTED,
  JobStatus.POSTED,
  JobStatus.PAID,
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  NEW: "งานใหม่",
  WAITING_STORYLINE_APPROVAL: "รอลูกค้าอนุมัติ Storyline",
  SHOOTING: "ถ่ายงาน",
  WAITING_DRAFT: "รอส่ง Draft",
  DRAFTED: "ส่ง Draft แล้ว",
  POSTED: "โพสต์แล้ว",
  PAID: "ได้รับเงินแล้ว",
};

export const JOB_STATUS_SHORT_LABEL: Record<JobStatus, string> = {
  NEW: "ใหม่",
  WAITING_STORYLINE_APPROVAL: "รออนุมัติ",
  SHOOTING: "ถ่ายงาน",
  WAITING_DRAFT: "รอ Draft",
  DRAFTED: "ส่ง Draft แล้ว",
  POSTED: "โพสต์แล้ว",
  PAID: "จ่ายแล้ว",
};

export const JOB_STATUS_COLOR: Record<JobStatus, string> = {
  NEW: "#8E8E93",
  WAITING_STORYLINE_APPROVAL: "#FF9500",
  SHOOTING: "#BF5AF2",
  WAITING_DRAFT: "#FF2D55",
  DRAFTED: "#007AFF",
  POSTED: "#34C759",
  PAID: "#30B0C7",
};
