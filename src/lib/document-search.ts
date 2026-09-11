import { THAI_MONTHS } from "@/lib/document";

/**
 * A search box entry can also name a period — "กันยายน", "ก.ย.", "2026",
 * or "2569" — which is how the payslip, timesheet and tax cards are
 * labelled. Periods are stored as plain year/month integers, so the text
 * has to be turned back into numbers before it can be matched.
 */
export function parsePeriodQuery(query: string) {
  const trimmed = query.trim();

  // Two characters is enough to be deliberate ("มี" → มีนาคม) without every
  // stray letter matching a month.
  const monthIndex =
    trimmed.length >= 2
      ? THAI_MONTHS.findIndex((name) => name.startsWith(trimmed.replace(/\./g, "")))
      : -1;

  const found = trimmed.match(/(?:^|\D)(\d{4})(?:\D|$)/);
  let year = found ? Number(found[1]) : null;
  // Thai documents are dated in the Buddhist Era; the database stores CE.
  if (year !== null && year > 2400) year -= 543;

  return { month: monthIndex >= 0 ? monthIndex + 1 : null, year };
}

/** The `OR` branches that match a period-labelled record, if any. */
export function periodMatches(query: string) {
  const { month, year } = parsePeriodQuery(query);
  const branches: { periodMonth?: number; periodYear?: number }[] = [];
  if (month !== null) branches.push({ periodMonth: month });
  if (year !== null) branches.push({ periodYear: year });
  return branches;
}
