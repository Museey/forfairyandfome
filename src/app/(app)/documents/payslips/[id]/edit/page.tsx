import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseLineItems } from "@/lib/document";
import { bangkokDateKey } from "@/lib/timezone";
import { PayslipForm } from "@/components/documents/payslip-form";

export default async function EditPayslipPage({
  params,
}: PageProps<"/documents/payslips/[id]/edit">) {
  const { id } = await params;
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) notFound();

  const period = `${payslip.periodYear}-${String(payslip.periodMonth).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href={`/documents/payslips/${payslip.id}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>
      <h1 className="text-xl font-semibold">แก้ไขสลิปเงินเดือน</h1>

      <PayslipForm
        defaultPeriod={period}
        defaultEmployeeName={payslip.employeeName}
        existing={{
          id: payslip.id,
          period,
          employeeName: payslip.employeeName,
          position: payslip.position,
          paymentDate: bangkokDateKey(payslip.paymentDate),
          earnings: parseLineItems(payslip.earnings),
          deductions: parseLineItems(payslip.deductions),
          note: payslip.note,
          status: payslip.status,
        }}
      />
    </div>
  );
}
