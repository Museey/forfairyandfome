import { prisma } from "@/lib/prisma";
import { computeTotals, monthKey, parseLineItems } from "@/lib/document";
import { bangkokYearMonth } from "@/lib/timezone";
import type { DocumentType } from "@/generated/prisma/enums";

/** Empty, or filed — and once filed, whether the signed copy is in. */
export type DocCellState = "NONE" | "UNSIGNED" | "SIGNED";

export type OverviewColumn = DocumentType | "WHT";

export type OverviewRow = {
  jobId: string;
  jobTitle: string;
  brandName: string;
  /** Net of the quotation for this month, else the invoice, else the receipt. */
  amount: number;
  cells: Record<OverviewColumn, DocCellState>;
};

export type OverviewMonth = {
  year: number;
  month: number;
  rows: OverviewRow[];
};

/** Which document states the agreed price, best first. */
const AMOUNT_PRIORITY: DocumentType[] = ["QUOTATION", "INVOICE", "RECEIPT"];

/**
 * The month-by-month table on the เอกสารทั้งหมด tab: one row per job that had
 * a document issued that month, one tick per document type.
 *
 * WHT is only ever an uploaded scan, so it has no unsigned state — a job
 * either has one on file or it doesn't, and it counts for every month that
 * job appears in.
 */
export async function loadDocumentOverview(): Promise<OverviewMonth[]> {
  const [documents, whtDocs] = await Promise.all([
    prisma.document.findMany({
      include: { job: true },
      orderBy: { issueDate: "desc" },
    }),
    prisma.taxDocument.findMany({
      where: { type: "WHT", jobId: { not: null } },
      select: { jobId: true },
    }),
  ]);

  const jobsWithWht = new Set(whtDocs.map((d) => d.jobId));

  // `amountRank` tracks which document the row's amount came from, so a
  // quotation can still replace an invoice's figure whatever order they
  // come back in. It's dropped again on the way out.
  type AccumulatingRow = OverviewRow & { amountRank: number };
  const months = new Map<
    number,
    { year: number; month: number; rows: AccumulatingRow[] }
  >();

  for (const doc of documents) {
    const { year, month } = bangkokYearMonth(doc.issueDate);
    const key = monthKey(year, month);

    let bucket = months.get(key);
    if (!bucket) {
      bucket = { year, month, rows: [] };
      months.set(key, bucket);
    }

    let row = bucket.rows.find((r) => r.jobId === doc.jobId);
    if (!row) {
      row = {
        jobId: doc.jobId,
        jobTitle: doc.job.title,
        brandName: doc.job.brandName,
        amount: 0,
        amountRank: Number.POSITIVE_INFINITY,
        cells: {
          QUOTATION: "NONE",
          INVOICE: "NONE",
          RECEIPT: "NONE",
          WHT: jobsWithWht.has(doc.jobId) ? "SIGNED" : "NONE",
        },
      };
      bucket.rows.push(row);
    }

    // A signed copy always outranks an unsigned one of the same type, and
    // documents arrive newest-first, so never downgrade a cell.
    if (row.cells[doc.type] !== "SIGNED") {
      row.cells[doc.type] = doc.signedFileUrl ? "SIGNED" : "UNSIGNED";
    }

    // The amount comes from the highest-priority document of the month.
    const rank = AMOUNT_PRIORITY.indexOf(doc.type);
    if (rank >= 0 && rank < row.amountRank) {
      row.amountRank = rank;
      row.amount = computeTotals(
        parseLineItems(doc.lineItems),
        doc.withholdingTaxPercent,
      ).net;
    }
  }

  return [...months.values()]
    .sort((a, b) => monthKey(b.year, b.month) - monthKey(a.year, a.month))
    .map(({ year, month, rows }) => ({
      year,
      month,
      rows: rows.map(({ jobId, jobTitle, brandName, amount, cells }) => ({
        jobId,
        jobTitle,
        brandName,
        amount,
        cells,
      })),
    }));
}
