import { dateKey } from "@/lib/calendar-grid";
import { JOB_DATE_FIELDS } from "@/lib/job-dates";

export type DayEvent = {
  jobId: string;
  jobTitle: string;
  label: string;
  color: string;
  icon?: "in" | "out";
};

const DATE_FIELD_COLOR: Record<string, string> = {
  storylineSendDate: "#FFB703",
  shootDate: "#64FFDA",
  draftSendDate: "#F4A261",
  postDate: "#A78BFA",
};

export const CHECK_EVENT_COLOR = "#5EA8FF";

type JobForEvents = {
  id: string;
  title: string;
  brandName: string;
  storylineSendDate: Date | null;
  shootDate: Date | null;
  draftSendDate: Date | null;
  postDate: Date | null;
};

type CheckEventForEvents = {
  id: string;
  jobId: string;
  type: "CHECK_IN" | "CHECK_OUT";
  occurredAt: Date;
  user: { name: string };
  job: { title: string; brandName: string };
};

export function buildEventsByDay(
  jobs: JobForEvents[],
  checkEvents: CheckEventForEvents[],
) {
  const eventsByDay = new Map<string, DayEvent[]>();

  function addEvent(key: string, event: DayEvent) {
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  for (const job of jobs) {
    for (const { key: field, label } of JOB_DATE_FIELDS) {
      const date = job[field];
      if (!date) continue;
      addEvent(dateKey(date), {
        jobId: job.id,
        jobTitle: `${job.brandName} · ${job.title}`,
        label,
        color: DATE_FIELD_COLOR[field],
      });
    }
  }

  for (const ev of checkEvents) {
    addEvent(dateKey(ev.occurredAt), {
      jobId: ev.jobId,
      jobTitle: `${ev.job.brandName} · ${ev.job.title}`,
      label: `${ev.user.name} ${ev.type === "CHECK_IN" ? "เช็คอิน" : "เช็คเอาท์"}`,
      color: CHECK_EVENT_COLOR,
      icon: ev.type === "CHECK_IN" ? "in" : "out",
    });
  }

  return eventsByDay;
}
