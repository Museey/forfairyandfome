"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { formatBaht } from "@/lib/document";
import {
  emptyTimesheetRow,
  formatHours,
  rowHours,
  timesheetTotals,
  type TimesheetRow,
} from "@/lib/payroll";
import {
  createTimesheet,
  timesheetRowsFromCheckIns,
  updateTimesheet,
} from "@/app/(app)/documents/actions";

export type ExistingTimesheet = {
  id: string;
  period: string;
  employeeName: string;
  position: string | null;
  rows: TimesheetRow[];
  ratePerHour: number | null;
};

export function TimesheetForm({
  defaultPeriod,
  defaultEmployeeName,
  seededRows,
  existing,
}: {
  defaultPeriod: string;
  defaultEmployeeName: string;
  /** Rows pre-built from the month's check-ins, for a brand new timesheet. */
  seededRows: TimesheetRow[];
  existing?: ExistingTimesheet;
}) {
  const isEdit = !!existing;
  const [period, setPeriod] = useState(existing?.period ?? defaultPeriod);
  const [rows, setRows] = useState<TimesheetRow[]>(
    existing?.rows ?? (seededRows.length > 0 ? seededRows : [emptyTimesheetRow()]),
  );
  const [ratePerHour, setRatePerHour] = useState(
    existing?.ratePerHour ? String(existing.ratePerHour) : "",
  );
  const [loading, startTransition] = useTransition();

  const totals = useMemo(
    () => timesheetTotals(rows, Number(ratePerHour) || null),
    [rows, ratePerHour],
  );

  function updateRow(index: number, field: keyof TimesheetRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function pullFromCheckIns() {
    startTransition(async () => {
      const fetched = await timesheetRowsFromCheckIns(period);
      if (fetched.length === 0) {
        alert("เดือนนี้ไม่มีข้อมูลเช็คอิน");
        return;
      }
      setRows(fetched);
    });
  }

  return (
    <form
      action={isEdit ? updateTimesheet : createTimesheet}
      className="flex flex-col gap-5"
    >
      {isEdit && <input type="hidden" name="id" value={existing.id} />}
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <input type="hidden" name="period" value={period} />

      <div>
        <Label htmlFor="period-input">รอบเดือน</Label>
        <Input
          id="period-input"
          type="month"
          lang="en-CA"
          required
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="employeeName">ชื่อพนักงาน</Label>
        <Input
          id="employeeName"
          name="employeeName"
          required
          defaultValue={existing?.employeeName ?? defaultEmployeeName}
        />
      </div>

      <div>
        <Label htmlFor="position">ตำแหน่ง</Label>
        <Input id="position" name="position" defaultValue={existing?.position ?? ""} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-text-muted">ตารางเวลา</h2>
          <button
            type="button"
            onClick={pullFromCheckIns}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-text-muted disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {loading ? "กำลังดึง..." : "ดึงจากเช็คอิน"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-text-faint">
                  {rowHours(row) > 0 ? `รวม ${formatHours(rowHours(row))} ชม.` : "—"}
                </span>
                <button
                  type="button"
                  aria-label="ลบแถว"
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  className="text-text-faint transition active:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input
                type="date"
                lang="en-CA"
                aria-label="วันที่"
                className="mb-2 min-w-0"
                value={row.date}
                onChange={(e) => updateRow(i, "date", e.target.value)}
              />
              <Input
                aria-label="งาน"
                placeholder="งานที่ทำ"
                className="mb-2"
                value={row.task}
                onChange={(e) => updateRow(i, "task", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  aria-label="เวลาเข้า"
                  className="min-w-0 flex-1"
                  value={row.start}
                  onChange={(e) => updateRow(i, "start", e.target.value)}
                />
                <span className="shrink-0 text-text-faint">–</span>
                <Input
                  type="time"
                  aria-label="เวลาออก"
                  className="min-w-0 flex-1"
                  value={row.end}
                  onChange={(e) => updateRow(i, "end", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyTimesheetRow()])}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border-strong py-2.5 text-sm text-text-muted transition active:bg-card"
        >
          <Plus className="h-4 w-4" />
          เพิ่มแถว
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <Label htmlFor="ratePerHour">ค่าแรงต่อชั่วโมง (เว้นว่างได้)</Label>
        <Input
          id="ratePerHour"
          name="ratePerHour"
          type="number"
          step="0.01"
          inputMode="decimal"
          value={ratePerHour}
          onChange={(e) => setRatePerHour(e.target.value)}
        />
      </div>

      <div className="rounded-card border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>จำนวนวัน</span>
          <span>{rows.length}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-text-muted">
          <span>ชั่วโมงรวม</span>
          <span>{formatHours(totals.totalHours)}</span>
        </div>
        {totals.totalPay !== null && (
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
            <span>ค่าแรงรวม</span>
            <span>{formatBaht(totals.totalPay)}</span>
          </div>
        )}
      </div>

      <Button type="submit" className="mt-1">
        {isEdit ? "บันทึกการแก้ไข" : "สร้างเอกสาร"}
      </Button>
    </form>
  );
}
