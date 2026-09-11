import { prisma } from "@/lib/prisma";
import { bangkokDateKey, bangkokMonthRange, bangkokTimeKey } from "@/lib/timezone";
import type { TimesheetRow } from "@/lib/payroll";

/**
 * Turns a month of check-in/check-out events into timesheet rows, so a
 * timesheet starts from what actually happened instead of a blank grid.
 * The result is only a starting point — it's saved as plain JSON and edited
 * by hand afterwards.
 *
 * One row per day worked: the earliest check-in and the latest check-out of
 * that day. A day that was never checked out keeps its start time and leaves
 * the end blank rather than guessing.
 */
export async function seedTimesheetRows(
  userId: string,
  year: number,
  month: number,
): Promise<TimesheetRow[]> {
  const { start, end } = bangkokMonthRange(year, month);

  const events = await prisma.checkEvent.findMany({
    where: { userId, occurredAt: { gte: start, lt: end } },
    include: { job: true },
    orderBy: { occurredAt: "asc" },
  });

  const byDay = new Map<string, TimesheetRow & { tasks: Set<string> }>();

  for (const event of events) {
    const day = bangkokDateKey(event.occurredAt);
    const time = bangkokTimeKey(event.occurredAt);

    let row = byDay.get(day);
    if (!row) {
      row = { date: day, task: "", start: "", end: "", tasks: new Set() };
      byDay.set(day, row);
    }

    if (event.job) row.tasks.add(event.job.title);
    if (event.type === "CHECK_IN") {
      if (!row.start) row.start = time; // earliest, since events are sorted
    } else {
      row.end = time; // latest wins
    }
  }

  return [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, start: s, end: e, tasks }) => ({
      date,
      task: [...tasks].join(", "),
      start: s,
      end: e,
    }));
}
