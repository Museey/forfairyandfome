import { prisma } from "@/lib/prisma";
import {
  APP_TIME_ZONE,
  bangkokMonthRange,
  bangkokYearMonth,
} from "@/lib/timezone";

const MONTH_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  month: "short",
  year: "numeric",
  calendar: "gregory",
  timeZone: APP_TIME_ZONE,
});

/** "ก.ย. 2026" — the Bangkok month a job was created in. */
export function formatJobMonth(date: Date) {
  return MONTH_FORMATTER.format(date);
}

/**
 * The number the next job created at `at` gets within its Bangkok calendar
 * month. Like document numbers it follows the highest number already used
 * that month rather than a count, so deleting a job leaves a gap instead of
 * handing its number to the next one.
 */
export async function nextJobMonthlySeq(at: Date = new Date()) {
  const { year, month } = bangkokYearMonth(at);
  const { start, end } = bangkokMonthRange(year, month);
  const { _max } = await prisma.job.aggregate({
    where: { createdAt: { gte: start, lt: end } },
    _max: { monthlySeq: true },
  });
  return (_max.monthlySeq ?? 0) + 1;
}
