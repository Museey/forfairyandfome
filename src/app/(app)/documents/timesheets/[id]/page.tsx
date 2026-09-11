import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBaht, formatMonthLabel } from "@/lib/document";
import { formatDateShort } from "@/lib/date";
import {
  formatHours,
  parseTimesheetRows,
  rowHours,
  timesheetTotals,
} from "@/lib/payroll";
import { deleteTimesheet } from "@/app/(app)/documents/actions";
import { PdfExportButton } from "@/components/pdf-export-button";
import { PdfPreviewButton } from "@/components/pdf-preview-button";

export default async function TimesheetDetailPage({
  params,
}: PageProps<"/documents/timesheets/[id]">) {
  const { id } = await params;
  const timesheet = await prisma.timesheet.findUnique({ where: { id } });
  if (!timesheet) notFound();

  const rows = parseTimesheetRows(timesheet.rows);
  const totals = timesheetTotals(rows, timesheet.ratePerHour);
  const title = `Time sheet - ${timesheet.docNumber}`;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href="/documents?tab=timesheets"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <p className="text-sm text-text-muted">{timesheet.docNumber}</p>
        <h1 className="text-xl font-semibold">
          Time sheet · {formatMonthLabel(timesheet.periodYear, timesheet.periodMonth)}
        </h1>
        <p className="mt-0.5 text-sm text-text-faint">
          {timesheet.employeeName}
          {timesheet.position ? ` · ${timesheet.position}` : ""}
        </p>
      </div>

      <div className="flex gap-2">
        <PdfPreviewButton
          url={`/api/timesheets/${timesheet.id}/pdf`}
          title={title}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-muted"
        />
        <PdfExportButton
          url={`/api/timesheets/${timesheet.id}/pdf`}
          filename={`${title}.pdf`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-3 text-sm font-medium text-teal"
        />
      </div>

      <Link
        href={`/documents/timesheets/${timesheet.id}/edit`}
        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-muted"
      >
        <Pencil className="h-4 w-4" />
        แก้ไข
      </Link>

      <section className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-card border border-border bg-card p-3 text-sm"
          >
            <span className="w-16 shrink-0 text-xs text-text-faint">
              {formatDateShort(row.date || null)}
            </span>
            <span className="min-w-0 flex-1 truncate">{row.task || "—"}</span>
            <span className="shrink-0 text-xs text-text-muted">
              {row.start || "--:--"}–{row.end || "--:--"}
            </span>
            <span className="w-12 shrink-0 text-right text-xs font-medium">
              {formatHours(rowHours(row))}
            </span>
          </div>
        ))}
      </section>

      <div className="rounded-card border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>ชั่วโมงรวม</span>
          <span>{formatHours(totals.totalHours)}</span>
        </div>
        {timesheet.ratePerHour && (
          <div className="mt-1.5 flex justify-between text-text-muted">
            <span>ค่าแรงต่อชั่วโมง</span>
            <span>{formatBaht(timesheet.ratePerHour)}</span>
          </div>
        )}
        {totals.totalPay !== null && (
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
            <span>ค่าแรงรวม</span>
            <span>{formatBaht(totals.totalPay)}</span>
          </div>
        )}
      </div>

      <form action={deleteTimesheet} className="mt-2">
        <input type="hidden" name="id" value={timesheet.id} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <Trash2 className="h-4 w-4" />
          ลบเอกสารนี้
        </button>
      </form>
    </div>
  );
}
