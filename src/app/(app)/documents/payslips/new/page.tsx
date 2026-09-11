import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PayslipForm } from "@/components/documents/payslip-form";
import { bangkokYearMonth } from "@/lib/timezone";

export default async function NewPayslipPage() {
  // The payslip is Fairy's, so the manager account is who it defaults to.
  const employee = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  const now = bangkokYearMonth(new Date());

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href="/documents?tab=payslips"
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>
      <h1 className="text-xl font-semibold">สลิปเงินเดือนใหม่</h1>

      <PayslipForm
        defaultPeriod={`${now.year}-${String(now.month).padStart(2, "0")}`}
        defaultEmployeeName={employee?.name ?? ""}
      />
    </div>
  );
}
