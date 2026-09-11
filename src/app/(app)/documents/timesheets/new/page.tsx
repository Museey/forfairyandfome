import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TimesheetForm } from "@/components/documents/timesheet-form";
import { seedTimesheetRows } from "@/lib/timesheet-seed";
import { bangkokYearMonth } from "@/lib/timezone";

export default async function NewTimesheetPage() {
  // The timesheet is Fairy's, so it starts from the manager's check-ins.
  const employee = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  const now = bangkokYearMonth(new Date());
  const rows = employee
    ? await seedTimesheetRows(employee.id, now.year, now.month)
    : [];

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href="/documents?tab=timesheets"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>
      <h1 className="text-xl font-semibold">Time sheet ใหม่</h1>
      <p className="-mt-3 text-xs text-text-faint">
        เติมจากเวลาเช็คอิน/เช็คเอาท์ของเดือนนี้ให้แล้ว แก้ไขได้ทุกช่อง
      </p>

      <TimesheetForm
        defaultPeriod={`${now.year}-${String(now.month).padStart(2, "0")}`}
        defaultEmployeeName={employee?.name ?? ""}
        seededRows={rows}
      />
    </div>
  );
}
