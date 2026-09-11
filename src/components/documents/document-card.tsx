import Link from "next/link";
import { FileText, PenLine } from "lucide-react";
import {
  DOCUMENT_STATUS_COLOR,
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_TYPE_LABEL,
  computeTotals,
  formatBaht,
  parseLineItems,
} from "@/lib/document";
import { formatDateShort } from "@/lib/date";
import { PdfPreviewButton } from "@/components/pdf-preview-button";
import { UploadFileButton } from "@/components/documents/upload-file-button";
import { attachSignedCopy } from "@/app/(app)/jobs/[id]/document-actions";
import type { Document, Job } from "@/generated/prisma/client";

const ROW_ACTION =
  "shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-text-muted";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

/**
 * One document as two versions: the draft the app renders on demand, and the
 * scan of the copy that came back signed. Until that scan is attached the
 * document isn't finished, which is what the overview table's grey ticks mean.
 */
export function DocumentCard({ doc }: { doc: Document & { job: Job } }) {
  const totals = computeTotals(
    parseLineItems(doc.lineItems),
    doc.withholdingTaxPercent,
  );
  const title = `${DOCUMENT_TYPE_LABEL[doc.type]} - ${doc.docNumber}`;

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <Link href={`/jobs/${doc.jobId}/documents/${doc.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">
            {DOCUMENT_TYPE_LABEL[doc.type]} · {doc.job.brandName}
          </p>
          <p className="shrink-0 text-sm font-semibold text-teal">
            {formatBaht(totals.net)}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-text-faint">
          {doc.docNumber} · {doc.buyerName}
        </p>
      </Link>

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-text-faint" />
          <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
            ฉบับร่าง · {formatDateShort(doc.issueDate)}
          </span>
          <Badge
            label={DOCUMENT_STATUS_LABEL[doc.status]}
            color={DOCUMENT_STATUS_COLOR[doc.status]}
          />
          <PdfPreviewButton
            url={`/api/documents/${doc.id}/pdf`}
            title={title}
            className={`${ROW_ACTION} inline-flex items-center gap-1`}
          />
        </div>

        <div className="flex items-center gap-2">
          <PenLine
            className="h-4 w-4 shrink-0"
            color={doc.signedFileUrl ? "#4ADE80" : "#B08D93"}
          />
          <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
            ฉบับเซ็น ·{" "}
            {doc.signedAt ? formatDateShort(doc.signedAt) : "ยังไม่มีไฟล์"}
          </span>
          {doc.signedFileUrl ? (
            <>
              <Badge label="เซ็นแล้ว" color="#4ADE80" />
              <a
                href={doc.signedFileUrl}
                target="_blank"
                rel="noreferrer"
                className={ROW_ACTION}
              >
                ดูไฟล์
              </a>
            </>
          ) : (
            <>
              <Badge label="รอแนบ" color="#FFB703" />
              <UploadFileButton
                action={attachSignedCopy}
                fields={{ docId: doc.id }}
                label="แนบ"
                className={ROW_ACTION}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
