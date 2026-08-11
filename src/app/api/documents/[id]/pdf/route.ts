import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { DocumentPdf } from "@/lib/pdf/document-document";
import { DOCUMENT_TYPE_LABEL, parseLineItems } from "@/lib/document";
import { pdfContentDisposition } from "@/lib/pdf/content-disposition";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/documents/[id]/pdf">,
) {
  await requireCurrentUser();
  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const seller = await prisma.sellerProfile.findUnique({ where: { id: 1 } });

  registerPdfFonts();

  const buffer = await renderToBuffer(
    DocumentPdf({
      type: doc.type,
      docNumber: doc.docNumber,
      issueDate: doc.issueDate,
      seller: seller
        ? {
            name: seller.name,
            address: seller.address,
            taxId: seller.taxId,
            contactName: seller.contactName,
            phone: seller.phone,
            email: seller.email,
            bankName: seller.bankName,
            bankAccountNo: seller.bankAccountNo,
            bankAccountName: seller.bankAccountName,
            branch: seller.branch,
          }
        : null,
      buyer: {
        name: doc.buyerName,
        address: doc.buyerAddress,
        taxId: doc.buyerTaxId,
        contactName: doc.buyerContactName,
        phone: doc.buyerPhone,
        email: doc.buyerEmail,
      },
      lineItems: parseLineItems(doc.lineItems),
      withholdingTaxPercent: doc.withholdingTaxPercent,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(
        `${DOCUMENT_TYPE_LABEL[doc.type]} - ${doc.docNumber}`,
      ),
    },
  });
}
