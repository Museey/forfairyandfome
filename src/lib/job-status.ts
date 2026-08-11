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
  NEW: "#8892B0",
  WAITING_STORYLINE_APPROVAL: "#FFB703",
  SHOOTING: "#64FFDA",
  WAITING_DRAFT: "#F4A261",
  DRAFTED: "#5EA8FF",
  POSTED: "#A78BFA",
  PAID: "#4ADE80",
};
