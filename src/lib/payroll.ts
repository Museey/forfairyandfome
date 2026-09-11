import { stripNullBytes, type LineItem } from "@/lib/document";

/**
 * Payslip totals. Deliberately simpler than an invoice: no VAT, no
 * withholding percentage — every deduction (ประกันสังคม, ภาษีหัก ณ ที่จ่าย,
 * ขาด/ลา/มาสาย) is just another line typed in by hand.
 */
export function payslipTotals(earnings: LineItem[], deductions: LineItem[]) {
  const sum = (items: LineItem[]) =>
    items.reduce((total, item) => total + (item.amount || 0), 0);
  const totalEarnings = sum(earnings);
  const totalDeductions = sum(deductions);
  return { totalEarnings, totalDeductions, net: totalEarnings - totalDeductions };
}

export type TimesheetRow = {
  /** "YYYY-MM-DD" in Bangkok — a plain key, never re-parsed as an instant. */
  date: string;
  task: string;
  /** "HH:MM", or "" when the day has no check-out yet. */
  start: string;
  end: string;
};

export function emptyTimesheetRow(date = ""): TimesheetRow {
  return { date, task: "", start: "", end: "" };
}

export function parseTimesheetRows(value: unknown): TimesheetRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      date: typeof v.date === "string" ? stripNullBytes(v.date) : "",
      task: typeof v.task === "string" ? stripNullBytes(v.task) : "",
      start: typeof v.start === "string" ? stripNullBytes(v.start) : "",
      end: typeof v.end === "string" ? stripNullBytes(v.end) : "",
    }));
}

/** Hours worked on one row, or 0 when either end of the day is missing. */
export function rowHours(row: TimesheetRow) {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
    return h * 60 + m;
  };
  const start = toMinutes(row.start);
  const end = toMinutes(row.end);
  if (start === null || end === null || end <= start) return 0;
  return (end - start) / 60;
}

/** "06:00" — the sample timesheet shows durations as HH:MM, not decimals. */
export function formatHours(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timesheetTotals(rows: TimesheetRow[], ratePerHour: number | null) {
  const totalHours = rows.reduce((total, row) => total + rowHours(row), 0);
  const totalPay = ratePerHour ? Math.round(totalHours * ratePerHour * 100) / 100 : null;
  return { totalHours, totalPay };
}
