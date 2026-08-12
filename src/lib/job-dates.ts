import { JobStatus } from "@/generated/prisma/enums";
import { JOB_STATUS_ORDER } from "@/lib/job-status";

export type JobDates = {
  storylineSendDate: Date | null;
  shootDate: Date | null;
  draftSendDate: Date | null;
  postDate: Date | null;
};

export const JOB_DATE_FIELDS: {
  key: keyof JobDates;
  label: string;
}[] = [
  { key: "storylineSendDate", label: "ส่ง Storyline" },
  { key: "shootDate", label: "ถ่ายงาน" },
  { key: "draftSendDate", label: "ส่ง Draft" },
  { key: "postDate", label: "โพสต์งาน" },
];

/** The job-status stage that should have been reached once this deadline has passed. */
export const JOB_DATE_FIELD_DONE_STATUS: Record<keyof JobDates, JobStatus> = {
  storylineSendDate: JobStatus.WAITING_STORYLINE_APPROVAL,
  shootDate: JobStatus.WAITING_DRAFT,
  draftSendDate: JobStatus.DRAFTED,
  postDate: JobStatus.POSTED,
};

export function isDateFieldDone(field: keyof JobDates, status: JobStatus) {
  const doneStatus = JOB_DATE_FIELD_DONE_STATUS[field];
  return JOB_STATUS_ORDER.indexOf(status) >= JOB_STATUS_ORDER.indexOf(doneStatus);
}

export function nextMilestone(job: JobDates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = JOB_DATE_FIELDS.map(({ key, label }) => {
    const date = job[key];
    return date ? { key, label, date } : null;
  }).filter((v): v is { key: keyof JobDates; label: string; date: Date } => !!v);

  if (candidates.length === 0) return null;

  const upcoming = candidates
    .filter((c) => c.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length > 0) return upcoming[0];

  return candidates.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}
