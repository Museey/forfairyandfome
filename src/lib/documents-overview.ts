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
  /** The job's number within the month it was created, if it has one. */
  jobMonthlySeq: number | null;
  brandName: string;
  /** Net of the job's quotation, else its invoice, else its receipt. */
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
 * The month-by-month table on the เอกสารทั้งหมด tab: one row per job that
 * has any document, under the month the job was created — the same month
 * its Job number counts in — oldest job first. Each tick covers all of that
 * job's documents of that type, whenever they were issued.
 *
 * WHT is only ever an uploaded scan, so it has no unsigned state — a job
 * either has one on file or it doesn't.
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
  // come back in. `jobCreatedAt` orders the rows. Both are dropped again on
  // the way out.
  type AccumulatingRow = OverviewRow & {
    amountRank: number;
    jobCreatedAt: Date;
  };
  const months = new Map<
    number,
    { year: number; month: number; rows: AccumulatingRow[] }
  >();

  for (const doc of documents) {
    const { year, month } = bangkokYearMonth(doc.job.createdAt);
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
        jobMonthlySeq: doc.job.monthlySeq,
        brandName: doc.job.brandName,
        amount: 0,
        amountRank: Number.POSITIVE_INFINITY,
        jobCreatedAt: doc.job.createdAt,
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
        doc.vatEnabled,
      ).net;
    }
  }

  return [...months.values()]
    .sort((a, b) => monthKey(b.year, b.month) - monthKey(a.year, a.month))
    .map(({ year, month, rows }) => ({
      year,
      month,
      // Jobs in the order they were created — the same order as their
      // monthly number, so งานที่ 1 heads the table.
      rows: rows
        .sort((a, b) => a.jobCreatedAt.getTime() - b.jobCreatedAt.getTime())
        .map(({ jobId, jobTitle, jobMonthlySeq, brandName, amount, cells }) => ({
          jobId,
          jobTitle,
          jobMonthlySeq,
          brandName,
          amount,
          cells,
        })),
    }));
}
