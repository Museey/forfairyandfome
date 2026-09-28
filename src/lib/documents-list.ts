import { prisma } from "@/lib/prisma";
import { periodMatches } from "@/lib/document-search";
import { monthKey } from "@/lib/document";
import { Prisma, type TaxDocument } from "@/generated/prisma/client";
import type { DocumentType, TaxDocType } from "@/generated/prisma/enums";

/** Rows per page on every list tab of the documents menu. */
export const PAGE_SIZE = 10;

export type Page<T> = { items: T[]; totalPages: number };

function paging(page: number) {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

function pageOf<T>(items: T[], total: number): Page<T> {
  return { items, totalPages: Math.ceil(total / PAGE_SIZE) };
}

/** Matches the search box against everything printed on a document card. */
function documentFilter(query: string): Prisma.DocumentWhereInput {
  if (!query) return {};
  const contains = { contains: query, mode: "insensitive" } as const;
  return {
    OR: [
      { docNumber: contains },
      { buyerName: contains },
      { job: { is: { brandName: contains } } },
      { job: { is: { title: contains } } },
    ],
  };
}

export async function loadDocumentPage(
  type: DocumentType,
  query: string,
  page: number,
) {
  const where: Prisma.DocumentWhereInput = { type, ...documentFilter(query) };
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { job: true },
      orderBy: { issueDate: "desc" },
      ...paging(page),
    }),
    prisma.document.count({ where }),
  ]);
  return pageOf(items, total);
}

export async function loadPayslipPage(query: string, page: number) {
  const contains = { contains: query, mode: "insensitive" } as const;
  const where: Prisma.PayslipWhereInput = query
    ? {
        OR: [
          { docNumber: contains },
          { employeeName: contains },
          { position: contains },
          ...periodMatches(query),
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.payslip.findMany({
      where,
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      ...paging(page),
    }),
    prisma.payslip.count({ where }),
  ]);
  return pageOf(items, total);
}

export async function loadTimesheetPage(query: string, page: number) {
  const contains = { contains: query, mode: "insensitive" } as const;
  const where: Prisma.TimesheetWhereInput = query
    ? {
        OR: [
          { docNumber: contains },
          { employeeName: contains },
          { position: contains },
          ...periodMatches(query),
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.timesheet.findMany({
      where,
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      ...paging(page),
    }),
    prisma.timesheet.count({ where }),
  ]);
  return pageOf(items, total);
}

function taxDocumentFilter(
  type: TaxDocType,
  query: string,
): Prisma.TaxDocumentWhereInput {
  const contains = { contains: query, mode: "insensitive" } as const;
  return {
    type,
    ...(query
      ? {
          OR: [
            { note: contains },
            { job: { is: { brandName: contains } } },
            { job: { is: { title: contains } } },
            ...periodMatches(query),
          ],
        }
      : {}),
  };
}

export async function loadTaxDocumentPage(
  type: TaxDocType,
  query: string,
  page: number,
) {
  const where = taxDocumentFilter(type, query);
  const [items, total] = await Promise.all([
    prisma.taxDocument.findMany({
      where,
      include: { job: true },
      orderBy: [
        { periodYear: "desc" },
        { periodMonth: "desc" },
        { createdAt: "desc" },
      ],
      ...paging(page),
    }),
    prisma.taxDocument.count({ where }),
  ]);
  return pageOf(items, total);
}

export type TaxFilingMonth = {
  year: number;
  month: number;
  documents: TaxDocument[];
};

/**
 * A form-plus-receipt type (ภ.พ.30, ภ.ง.ด.1), one entry per month, newest
 * first and paged by month so a month's two files never split across
 * pages. Without a search, `current` is always listed so this month's
 * empty slots are ready to fill. `filled` names every slot that already
 * has a file, on any page.
 */
export async function loadTaxFilingMonths(
  type: TaxDocType,
  query: string,
  page: number,
  current: { year: number; month: number },
): Promise<Page<TaxFilingMonth> & { filled: string[] }> {
  const documents = await prisma.taxDocument.findMany({
    where: taxDocumentFilter(type, query),
    orderBy: { createdAt: "asc" },
  });

  const months = new Map<number, TaxFilingMonth>();
  const monthFor = (year: number, month: number) => {
    const key = monthKey(year, month);
    let entry = months.get(key);
    if (!entry) {
      entry = { year, month, documents: [] };
      months.set(key, entry);
    }
    return entry;
  };

  if (!query) monthFor(current.year, current.month);
  for (const doc of documents) {
    monthFor(doc.periodYear, doc.periodMonth ?? 1).documents.push(doc);
  }

  const sorted = [...months.values()].sort(
    (a, b) => monthKey(b.year, b.month) - monthKey(a.year, a.month),
  );
  const { skip, take } = paging(page);
  return {
    ...pageOf(sorted.slice(skip, skip + take), sorted.length),
    filled: documents.map((d) =>
      filledSlotKey(d.periodYear, d.periodMonth ?? 1, d.part ?? "FORM"),
    ),
  };
}

/** "2026-09:FORM" — one half of one month's filing. */
function filledSlotKey(year: number, month: number, part: string) {
  return `${year}-${String(month).padStart(2, "0")}:${part}`;
}
