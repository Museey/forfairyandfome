import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { PayslipPdf } from "@/lib/pdf/payslip-document";
import { parseLineItems } from "@/lib/document";
import { pdfContentDisposition } from "@/lib/pdf/content-disposition";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/payslips/[id]/pdf">,
) {
  await requireCurrentUser();
  const { id } = await params;

  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const seller = await prisma.sellerProfile.findUnique({ where: { id: 1 } });

  registerPdfFonts();

  const buffer = await renderToBuffer(
    PayslipPdf({
      docNumber: payslip.docNumber,
      periodYear: payslip.periodYear,
      periodMonth: payslip.periodMonth,
      paymentDate: payslip.paymentDate,
      employeeName: payslip.employeeName,
      position: payslip.position,
      earnings: parseLineItems(payslip.earnings),
      deductions: parseLineItems(payslip.deductions),
      note: payslip.note,
      employer: seller
        ? { name: seller.name, address: seller.address, taxId: seller.taxId }
        : null,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(
        `สลิปเงินเดือน - ${payslip.docNumber}`,
      ),
    },
  });
}
