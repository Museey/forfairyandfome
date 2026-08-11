import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileDown, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DOCUMENT_TYPE_LABEL, computeTotals, formatBaht, parseLineItems } from "@/lib/document";
import { formatDate } from "@/lib/date";
import { DocumentStatusSelect } from "@/components/documents/document-status-select";
import { DuplicateAsButtons } from "@/components/documents/duplicate-as-buttons";
import { deleteDocument } from "@/app/(app)/jobs/[id]/document-actions";

export default async function DocumentDetailPage({
  params,
}: PageProps<"/jobs/[id]/documents/[docId]">) {
  const { id, docId } = await params;

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.jobId !== id) notFound();

  const lineItems = parseLineItems(doc.lineItems);
  const totals = computeTotals(lineItems, doc.withholdingTaxPercent);

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2 pb-6">
      <Link
        href={`/jobs/${id}?tab=documents`}
        className="inline-flex items-center gap-1 text-sm text-text-muted"
      >
        <ChevronLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <p className="text-sm text-text-muted">{doc.docNumber}</p>
        <h1 className="text-xl font-semibold">{DOCUMENT_TYPE_LABEL[doc.type]}</h1>
        <p className="mt-0.5 text-sm text-text-faint">{formatDate(doc.issueDate)}</p>
      </div>

      <div className="flex gap-2">
        <a
          href={`/api/documents/${doc.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-3 text-sm font-medium text-teal"
        >
          <FileDown className="h-4 w-4" />
          ส่งออก PDF
        </a>
        <Link
          href={`/jobs/${id}/documents/${doc.id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-muted"
        >
          <Pencil className="h-4 w-4" />
          แก้ไข
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">สถานะ</h2>
        <DocumentStatusSelect docId={doc.id} jobId={id} status={doc.status} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">ผู้ซื้อ</h2>
        <div className="rounded-card border border-border bg-card p-4 text-sm">
          <p className="font-medium">{doc.buyerName}</p>
          {doc.buyerAddress && <p className="mt-1 text-text-muted">{doc.buyerAddress}</p>}
          {doc.buyerTaxId && (
            <p className="mt-1 text-text-faint">เลขผู้เสียภาษี {doc.buyerTaxId}</p>
          )}
          {doc.buyerContactName && (
            <p className="mt-1 text-text-faint">ผู้ติดต่อ {doc.buyerContactName}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">รายการ</h2>
        <div className="flex flex-col gap-2.5">
          {lineItems.map((item, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-3 text-sm">
              <p className="whitespace-pre-wrap text-text-muted">{item.description}</p>
              <p className="mt-1.5 text-right font-medium">{formatBaht(item.amount)}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-card border border-border bg-card p-4 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>รวมเป็นเงิน</span>
            <span>{formatBaht(totals.subtotal)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-text-muted">
            <span>หัก ณ ที่จ่าย ({doc.withholdingTaxPercent}%)</span>
            <span>-{formatBaht(totals.withholdingTax)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-teal">
            <span>ยอดรวม</span>
            <span>{formatBaht(totals.net)}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-muted">สร้างเอกสารอื่นจากใบนี้</h2>
        <DuplicateAsButtons docId={doc.id} jobId={id} currentType={doc.type} />
      </section>

      <form action={deleteDocument} className="mt-2">
        <input type="hidden" name="docId" value={doc.id} />
        <input type="hidden" name="jobId" value={id} />
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
