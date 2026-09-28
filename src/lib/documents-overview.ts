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
  /**
   * Net of the job's quotation, else its invoice, else its receipt; null
   * while it has none of them.
   */
  amount: number | null;
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
 * The month-by-month table on the เอกสารทั้งหมด tab: one row per job, under
 * the month the job was created — the same month its Job number counts in —
 * oldest job first. Every งานปกติ is listed, documents or not, so a row of
 * dashes shows what's still to be issued; a งานฟรี never takes documents
 * and is left out. Each tick covers all of that job's documents of that
 * type, whenever they were issued.
 *
 * WHT is only ever an uploaded scan, so it has no unsigned state — a job
 * either has one on file or it doesn't.
 */
export async function loadDocumentOverview(): Promise<OverviewMonth[]> {
  const jobs = await prisma.job.findMany({
    // A job switched to free keeps any documents it already had.
    where: { OR: [{ kind: "STANDARD" }, { documents: { some: {} } }] },
    include: {
      documents: true,
      _count: { select: { taxDocuments: { where: { type: "WHT" } } } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const months = new Map<number, OverviewMonth>();

  for (const job of jobs) {
    const { year, month } = bangkokYearMonth(job.createdAt);
    const key = monthKey(year, month);
    let bucket = months.get(key);
    if (!bucket) {
      bucket = { year, month, rows: [] };
      months.set(key, bucket);
    }

    const cells: Record<OverviewColumn, DocCellState> = {
      QUOTATION: "NONE",
      INVOICE: "NONE",
      RECEIPT: "NONE",
      WHT: job._count.taxDocuments > 0 ? "SIGNED" : "NONE",
    };
    // A signed copy of any one document of a type makes the tick signed.
    for (const doc of job.documents) {
      if (cells[doc.type] !== "SIGNED") {
        cells[doc.type] = doc.signedFileUrl ? "SIGNED" : "UNSIGNED";
      }
    }

    // The amount comes from the highest-priority document; the newest one
    // if the job has several of that type.
    const priced = job.documents
      .filter((d) => AMOUNT_PRIORITY.includes(d.type))
      .sort(
        (a, b) =>
          AMOUNT_PRIORITY.indexOf(a.type) - AMOUNT_PRIORITY.indexOf(b.type) ||
          b.issueDate.getTime() - a.issueDate.getTime(),
      )[0];
    const amount = priced
      ? computeTotals(
          parseLineItems(priced.lineItems),
          priced.withholdingTaxPercent,
          priced.vatEnabled,
        ).net
      : null;

    bucket.rows.push({
      jobId: job.id,
      jobTitle: job.title,
      jobMonthlySeq: job.monthlySeq,
      brandName: job.brandName,
      amount,
      cells,
    });
  }

  return [...months.values()].sort(
    (a, b) => monthKey(b.year, b.month) - monthKey(a.year, a.month),
  );
}
