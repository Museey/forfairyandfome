import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBaht, formatMonthLabel, parseLineItems } from "@/lib/document";
import { formatDate } from "@/lib/date";
import { payslipTotals } from "@/lib/payroll";
import { deletePayslip } from "@/app/(app)/documents/actions";
import { PdfExportButton } from "@/components/pdf-export-button";
import { PdfPreviewButton } from "@/components/pdf-preview-button";

export default async function PayslipDetailPage({
  params,
}: PageProps<"/documents/payslips/[id]">) {
  const { id } = await params;
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) notFound();

  const earnings = parseLineItems(payslip.earnings);
  const deductions = parseLineItems(payslip.deductions);
  const totals = payslipTotals(earnings, deductions);
  const title = `สลิปเงินเดือน - ${payslip.docNumber}`;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href="/documents?tab=payslips"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <p className="text-sm text-text-muted">{payslip.docNumber}</p>
        <h1 className="text-xl font-semibold">
          สลิปเงินเดือน · {formatMonthLabel(payslip.periodYear, payslip.periodMonth)}
        </h1>
        <p className="mt-0.5 text-sm text-text-faint">
          {payslip.employeeName}
          {payslip.position ? ` · ${payslip.position}` : ""} · จ่าย{" "}
          {formatDate(payslip.paymentDate)}
        </p>
      </div>

      <div className="flex gap-2">
        <PdfPreviewButton
          url={`/api/payslips/${payslip.id}/pdf`}
          title={title}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-muted"
        />
        <PdfExportButton
          url={`/api/payslips/${payslip.id}/pdf`}
          filename={`${title}.pdf`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-3 text-sm font-medium text-teal"
        />
      </div>

      <Link
        href={`/documents/payslips/${payslip.id}/edit`}
        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-muted"
      >
        <Pencil className="h-4 w-4" />
        แก้ไข
      </Link>

      <section className="rounded-card border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-sm font-medium text-text-muted">รายได้</h2>
        {earnings.map((item, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span className="min-w-0 truncate pr-3">{item.description}</span>
            <span className="shrink-0">{formatBaht(item.amount)}</span>
          </div>
        ))}

        <h2 className="mt-4 mb-2 text-sm font-medium text-text-muted">รายการหัก</h2>
        {deductions.map((item, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span className="min-w-0 truncate pr-3">{item.description}</span>
            <span className="shrink-0">-{formatBaht(item.amount)}</span>
          </div>
        ))}

        <div className="mt-3 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
          <span>เงินได้สุทธิ</span>
          <span>{formatBaht(totals.net)}</span>
        </div>
      </section>

      {payslip.note && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-muted">หมายเหตุ</h2>
          <p className="rounded-card border border-border bg-card p-4 text-sm whitespace-pre-wrap">
            {payslip.note}
          </p>
        </section>
      )}

      <form action={deletePayslip} className="mt-2">
        <input type="hidden" name="id" value={payslip.id} />
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
