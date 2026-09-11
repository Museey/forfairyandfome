import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseTimesheetRows } from "@/lib/payroll";
import { TimesheetForm } from "@/components/documents/timesheet-form";

export default async function EditTimesheetPage({
  params,
}: PageProps<"/documents/timesheets/[id]/edit">) {
  const { id } = await params;
  const timesheet = await prisma.timesheet.findUnique({ where: { id } });
  if (!timesheet) notFound();

  const period = `${timesheet.periodYear}-${String(timesheet.periodMonth).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href={`/documents/timesheets/${timesheet.id}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>
      <h1 className="text-xl font-semibold">แก้ไข Time sheet</h1>

      <TimesheetForm
        defaultPeriod={period}
        defaultEmployeeName={timesheet.employeeName}
        seededRows={[]}
        existing={{
          id: timesheet.id,
          period,
          employeeName: timesheet.employeeName,
          position: timesheet.position,
          rows: parseTimesheetRows(timesheet.rows),
          ratePerHour: timesheet.ratePerHour,
        }}
      />
    </div>
  );
}
