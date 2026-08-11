import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_STATUS_COLOR,
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_TYPE_LABEL,
  computeTotals,
  formatBaht,
  parseLineItems,
} from "@/lib/document";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    include: { job: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (documents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-text-faint">
        <FileText className="h-6 w-6" />
        <p className="text-sm">ยังไม่มีเอกสารในระบบ</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2">
      <h1 className="text-xl font-semibold">เอกสารทั้งหมด</h1>

      <div className="flex flex-col gap-3 pb-6">
        {documents.map((doc) => {
          const totals = computeTotals(
            parseLineItems(doc.lineItems),
            doc.withholdingTaxPercent,
          );
          return (
            <Link
              key={doc.id}
              href={`/jobs/${doc.jobId}/documents/${doc.id}`}
              className="rounded-card border border-border bg-card p-4 transition active:scale-[0.99] active:bg-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {DOCUMENT_TYPE_LABEL[doc.type]} · {doc.job.brandName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-faint">
                    {doc.docNumber} · {doc.buyerName}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${DOCUMENT_STATUS_COLOR[doc.status]}22`,
                    color: DOCUMENT_STATUS_COLOR[doc.status],
                  }}
                >
                  {DOCUMENT_STATUS_LABEL[doc.status]}
                </span>
              </div>
              <p className="mt-2 text-right text-sm font-semibold text-teal">
                {formatBaht(totals.net)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
