import Link from "next/link";
import { Check } from "lucide-react";
import { formatBaht, formatMonthLabel } from "@/lib/document";
import type {
  DocCellState,
  OverviewColumn,
  OverviewMonth,
} from "@/lib/documents-overview";

const COLUMNS: { key: OverviewColumn; label: string }[] = [
  { key: "QUOTATION", label: "ใบเสนอราคา" },
  { key: "INVOICE", label: "ใบแจ้งหนี้" },
  { key: "RECEIPT", label: "ใบเสร็จรับเงิน / ใบกำกับภาษี" },
  { key: "WHT", label: "WHT" },
];

function Tick({ state }: { state: DocCellState }) {
  if (state === "NONE") return <span className="text-text-faint">–</span>;
  const signed = state === "SIGNED";
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full"
      style={{ backgroundColor: signed ? "#B8E986" : "#D4D4D8" }}
      title={signed ? "มีเอกสารแล้ว + เซ็นแล้ว" : "มีเอกสารแล้ว แต่ยังไม่เซ็น"}
    >
      <Check className="h-3 w-3" color={signed ? "#2F6B1F" : "#6B7280"} strokeWidth={3} />
    </span>
  );
}

function MonthTable({ month }: { month: OverviewMonth }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-text-muted">
        ตารางภาพรวมเอกสาร · {formatMonthLabel(month.year, month.month)}
      </h2>

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 overflow-hidden rounded-card border border-border bg-card text-sm">
          <thead>
            <tr className="text-xs text-text-muted">
              <th className="border-b border-border px-3 py-2 text-left font-medium">
                แบรนด์ / งาน
              </th>
              <th className="border-b border-border px-3 py-2 text-right font-medium">
                จำนวนเงิน
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-border px-3 py-2 text-center font-medium"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.rows.map((row) => (
              <tr key={row.jobId}>
                <td className="border-b border-border px-3 py-2.5">
                  <Link href={`/jobs/${row.jobId}?tab=documents`} className="block">
                    <span className="block max-w-[9rem] truncate">{row.brandName}</span>
                    <span className="block max-w-[9rem] truncate text-xs text-text-faint">
                      {row.jobTitle}
                    </span>
                  </Link>
                </td>
                <td className="border-b border-border px-3 py-2.5 text-right whitespace-nowrap">
                  {formatBaht(row.amount)}
                </td>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className="border-b border-border px-3 py-2.5 text-center"
                  >
                    <Tick state={row.cells[column.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OverviewTables({ months }: { months: OverviewMonth[] }) {
  if (months.length === 0) {
    return <p className="py-8 text-center text-sm text-text-faint">ยังไม่มีเอกสารในระบบ</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Tick state="SIGNED" /> มีเอกสารแล้ว + เซ็นแล้ว
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Tick state="UNSIGNED" /> มีเอกสารแล้ว แต่ยังไม่เซ็น
        </span>
      </div>

      {months.map((month) => (
        <MonthTable key={`${month.year}-${month.month}`} month={month} />
      ))}
    </div>
  );
}
