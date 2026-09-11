import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { TimesheetPdf } from "@/lib/pdf/timesheet-document";
import { parseTimesheetRows } from "@/lib/payroll";
import { pdfContentDisposition } from "@/lib/pdf/content-disposition";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/timesheets/[id]/pdf">,
) {
  await requireCurrentUser();
  const { id } = await params;

  const timesheet = await prisma.timesheet.findUnique({ where: { id } });
  if (!timesheet) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const seller = await prisma.sellerProfile.findUnique({ where: { id: 1 } });

  registerPdfFonts();

  const buffer = await renderToBuffer(
    TimesheetPdf({
      docNumber: timesheet.docNumber,
      periodYear: timesheet.periodYear,
      periodMonth: timesheet.periodMonth,
      employeeName: timesheet.employeeName,
      position: timesheet.position,
      rows: parseTimesheetRows(timesheet.rows),
      ratePerHour: timesheet.ratePerHour,
      employer: seller ? { name: seller.name } : null,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(
        `Time sheet - ${timesheet.docNumber}`,
      ),
    },
  });
}
