import Link from "next/link";
import { formatBaht, formatMonthLabel } from "@/lib/document";
import { formatHours, parseTimesheetRows, timesheetTotals } from "@/lib/payroll";
import type { Timesheet } from "@/generated/prisma/client";

export function TimesheetCard({ timesheet }: { timesheet: Timesheet }) {
  const rows = parseTimesheetRows(timesheet.rows);
  const totals = timesheetTotals(rows, timesheet.ratePerHour);

  return (
    <Link
      href={`/documents/timesheets/${timesheet.id}`}
      className="rounded-card border border-border bg-card p-4 transition active:scale-[0.99] active:bg-card-hover"
    >
      <p className="truncate text-sm font-medium">
        Time sheet · {formatMonthLabel(timesheet.periodYear, timesheet.periodMonth)}
      </p>
      <p className="mt-0.5 truncate text-xs text-text-faint">
        {timesheet.docNumber} · {rows.length} วัน · รวม {formatHours(totals.totalHours)} ชม.
      </p>
      {totals.totalPay !== null && (
        <p className="mt-2 text-right text-sm font-semibold text-teal">
          {formatBaht(totals.totalPay)}
        </p>
      )}
    </Link>
  );
}
