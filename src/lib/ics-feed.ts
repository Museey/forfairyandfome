import { createEvents, type EventAttributes } from "ics";
import { JOB_DATE_FIELDS } from "@/lib/job-dates";

type JobForFeed = {
  id: string;
  title: string;
  brandName: string;
  storylineSendDate: Date | null;
  shootDate: Date | null;
  draftSendDate: Date | null;
  postDate: Date | null;
};

type CheckEventForFeed = {
  id: string;
  type: "CHECK_IN" | "CHECK_OUT";
  occurredAt: Date;
  user: { name: string };
  job: { title: string; brandName: string };
};

export function buildIcsFeed(jobs: JobForFeed[], checkEvents: CheckEventForFeed[]) {
  const events: EventAttributes[] = [];

  for (const job of jobs) {
    for (const { key, label } of JOB_DATE_FIELDS) {
      const date = job[key];
      if (!date) continue;
      events.push({
        uid: `job-${job.id}-${key}@fairyandFome`,
        title: `${label} · ${job.brandName} - ${job.title}`,
        // Date-only fields are parsed as UTC midnight — read back with UTC
        // getters so the calendar date can't shift on a non-UTC server TZ.
        start: [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()],
        duration: { days: 1 },
      });
    }
  }

  for (const ev of checkEvents) {
    const d = ev.occurredAt;
    events.push({
      uid: `check-${ev.id}@fairyandFome`,
      title: `${ev.user.name} ${ev.type === "CHECK_IN" ? "เช็คอิน" : "เช็คเอาท์"} · ${ev.job.brandName} - ${ev.job.title}`,
      // ics's array form is emitted as UTC ("Z") — use UTC getters so the
      // absolute instant survives regardless of the server process's local TZ.
      start: [
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
      ],
      duration: { minutes: 15 },
    });
  }

  const { error, value } = createEvents(events);
  if (error) throw error;
  return value ?? "";
}
