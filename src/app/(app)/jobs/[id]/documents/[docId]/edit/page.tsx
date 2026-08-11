import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseLineItems } from "@/lib/document";
import { DocumentForm } from "@/components/documents/document-form";

export default async function EditDocumentPage({
  params,
}: PageProps<"/jobs/[id]/documents/[docId]/edit">) {
  const { id, docId } = await params;

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.jobId !== id) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2 pb-6">
      <Link
        href={`/jobs/${id}/documents/${docId}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <h1 className="text-xl font-semibold">แก้ไขเอกสาร</h1>

      <DocumentForm
        jobId={id}
        existingDocument={{
          id: doc.id,
          type: doc.type,
          issueDate: doc.issueDate,
          buyerName: doc.buyerName,
          buyerAddress: doc.buyerAddress,
          buyerTaxId: doc.buyerTaxId,
          buyerContactName: doc.buyerContactName,
          buyerPhone: doc.buyerPhone,
          buyerEmail: doc.buyerEmail,
          withholdingTaxPercent: doc.withholdingTaxPercent,
          lineItems: parseLineItems(doc.lineItems),
        }}
      />
    </div>
  );
}
