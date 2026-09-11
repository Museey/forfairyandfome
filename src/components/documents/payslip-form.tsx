"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { formatBaht, type LineItem } from "@/lib/document";
import { payslipTotals } from "@/lib/payroll";
import { createPayslip, updatePayslip } from "@/app/(app)/documents/actions";
import type { DocumentStatus } from "@/generated/prisma/enums";

/** Everything an employer normally fills in; amounts they don't pay stay at 0. */
const DEFAULT_EARNINGS: LineItem[] = [{ description: "เงินเดือน", amount: 0 }];
const DEFAULT_DEDUCTIONS: LineItem[] = [
  { description: "ประกันสังคม", amount: 0 },
  { description: "ภาษีหัก ณ ที่จ่าย", amount: 0 },
];

export type ExistingPayslip = {
  id: string;
  period: string;
  employeeName: string;
  position: string | null;
  paymentDate: string;
  earnings: LineItem[];
  deductions: LineItem[];
  note: string | null;
  status: DocumentStatus;
};

function LineItemRows({
  heading,
  items,
  onChange,
  placeholder,
}: {
  heading: string;
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  placeholder: string;
}) {
  return (
    <div className="border-t border-border pt-4">
      <h2 className="mb-3 text-sm font-medium text-text-muted">{heading}</h2>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder={placeholder}
              value={item.description}
              onChange={(e) =>
                onChange(
                  items.map((it, index) =>
                    index === i ? { ...it, description: e.target.value } : it,
                  ),
                )
              }
            />
            <Input
              className="w-28 shrink-0"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={item.amount || ""}
              onChange={(e) =>
                onChange(
                  items.map((it, index) =>
                    index === i ? { ...it, amount: Number(e.target.value) || 0 } : it,
                  ),
                )
              }
            />
            <button
              type="button"
              aria-label="ลบรายการ"
              onClick={() => onChange(items.filter((_, index) => index !== i))}
              className="shrink-0 text-text-faint transition active:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { description: "", amount: 0 }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border-strong py-2.5 text-sm text-text-muted transition active:bg-card"
      >
        <Plus className="h-4 w-4" />
        เพิ่มรายการ
      </button>
    </div>
  );
}

export function PayslipForm({
  defaultPeriod,
  defaultEmployeeName,
  existing,
}: {
  defaultPeriod: string;
  defaultEmployeeName: string;
  existing?: ExistingPayslip;
}) {
  const isEdit = !!existing;
  const [earnings, setEarnings] = useState<LineItem[]>(
    existing?.earnings.length ? existing.earnings : DEFAULT_EARNINGS,
  );
  const [deductions, setDeductions] = useState<LineItem[]>(
    existing?.deductions.length ? existing.deductions : DEFAULT_DEDUCTIONS,
  );

  const totals = useMemo(
    () => payslipTotals(earnings, deductions),
    [earnings, deductions],
  );

  return (
    <form
      action={isEdit ? updatePayslip : createPayslip}
      className="flex flex-col gap-5"
    >
      {isEdit && <input type="hidden" name="id" value={existing.id} />}
      <input type="hidden" name="earnings" value={JSON.stringify(earnings)} />
      <input type="hidden" name="deductions" value={JSON.stringify(deductions)} />

      <div>
        <Label htmlFor="period">รอบเงินเดือน</Label>
        <Input
          id="period"
          name="period"
          type="month"
          lang="en-CA"
          required
          defaultValue={existing?.period ?? defaultPeriod}
        />
      </div>

      <div>
        <Label htmlFor="paymentDate">วันที่จ่าย</Label>
        <Input
          id="paymentDate"
          name="paymentDate"
          type="date"
          lang="en-CA"
          defaultValue={existing?.paymentDate ?? ""}
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

      <LineItemRows
        heading="รายได้"
        items={earnings}
        onChange={setEarnings}
        placeholder="เช่น เงินเดือน, โบนัส"
      />

      <LineItemRows
        heading="รายการหัก"
        items={deductions}
        onChange={setDeductions}
        placeholder="เช่น ประกันสังคม"
      />

      <div className="border-t border-border pt-4">
        <Label htmlFor="note">หมายเหตุ</Label>
        <Textarea id="note" name="note" rows={2} defaultValue={existing?.note ?? ""} />
      </div>

      <div>
        <Label htmlFor="status">สถานะ</Label>
        <Select id="status" name="status" defaultValue={existing?.status ?? "DRAFT"}>
          <option value="DRAFT">ฉบับร่าง</option>
          <option value="SENT">ส่งแล้ว</option>
          <option value="PAID">จ่ายแล้ว</option>
        </Select>
      </div>

      <div className="rounded-card border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>รวมรายได้</span>
          <span>{formatBaht(totals.totalEarnings)}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-text-muted">
          <span>รวมรายการหัก</span>
          <span>-{formatBaht(totals.totalDeductions)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
          <span>เงินได้สุทธิ</span>
          <span>{formatBaht(totals.net)}</span>
        </div>
      </div>

      <Button type="submit" className="mt-1">
        {isEdit ? "บันทึกการแก้ไข" : "สร้างเอกสาร"}
      </Button>
    </form>
  );
}
