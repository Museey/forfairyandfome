import Link from "next/link";
import {
  DOCUMENT_STATUS_COLOR,
  DOCUMENT_STATUS_LABEL,
  formatBaht,
  formatMonthLabel,
  parseLineItems,
} from "@/lib/document";
import { payslipTotals } from "@/lib/payroll";
import type { Payslip } from "@/generated/prisma/client";

export function PayslipCard({ payslip }: { payslip: Payslip }) {
  const totals = payslipTotals(
    parseLineItems(payslip.earnings),
    parseLineItems(payslip.deductions),
  );

  return (
    <Link
      href={`/documents/payslips/${payslip.id}`}
      className="rounded-card border border-border bg-card p-4 transition active:scale-[0.99] active:bg-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">
          สลิปเงินเดือน · {formatMonthLabel(payslip.periodYear, payslip.periodMonth)}
        </p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: `${DOCUMENT_STATUS_COLOR[payslip.status]}22`,
            color: DOCUMENT_STATUS_COLOR[payslip.status],
          }}
        >
          {DOCUMENT_STATUS_LABEL[payslip.status]}
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-text-faint">
        {payslip.docNumber} · {payslip.employeeName}
      </p>
      <p className="mt-2 text-right text-sm font-semibold text-teal">
        {formatBaht(totals.net)}
      </p>
    </Link>
  );
}
