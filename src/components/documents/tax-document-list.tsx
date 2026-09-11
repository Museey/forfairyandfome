import { FileCheck2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/date";
import { formatMonthLabel } from "@/lib/document";
import { TAX_DOC_LABEL } from "@/lib/tax-document";
import { deleteTaxDocument } from "@/app/(app)/documents/actions";
import type { Job, TaxDocument } from "@/generated/prisma/client";

/** "ภ.พ.30 · มกราคม 2026", "ภ.ง.ด.90 · 2026", "WHT · Dutch Mill". */
function cardTitle(doc: TaxDocument & { job: Job | null }) {
  const label = TAX_DOC_LABEL[doc.type];
  if (doc.job) return `${label} · ${doc.job.brandName}`;
  if (doc.periodMonth) {
    return `${label} · ${formatMonthLabel(doc.periodYear, doc.periodMonth)}`;
  }
  return `${label} · ${doc.periodYear}`;
}

export function TaxDocumentList({
  documents,
}: {
  documents: (TaxDocument & { job: Job | null })[];
}) {
  if (documents.length === 0) {
    return <p className="py-8 text-center text-sm text-text-faint">ยังไม่มีเอกสารแนบ</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-card border border-border bg-card p-3.5"
        >
          <FileCheck2 className="h-5 w-5 shrink-0 text-teal" />
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1"
          >
            <span className="block truncate text-sm font-medium">{cardTitle(doc)}</span>
            <span className="block truncate text-xs text-text-faint">
              {doc.note ? `${doc.note} · ` : ""}
              แนบเมื่อ {formatDate(doc.createdAt)}
            </span>
          </a>
          <form action={deleteTaxDocument} className="shrink-0">
            <input type="hidden" name="id" value={doc.id} />
            <button
              type="submit"
              aria-label="ลบเอกสาร"
              className="rounded-full p-1.5 text-text-faint transition active:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
