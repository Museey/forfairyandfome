import { prisma } from "@/lib/prisma";
import { periodMatches } from "@/lib/document-search";
import { Prisma } from "@/generated/prisma/client";
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

export async function loadTaxDocumentPage(
  type: TaxDocType,
  query: string,
  page: number,
) {
  const contains = { contains: query, mode: "insensitive" } as const;
  const where: Prisma.TaxDocumentWhereInput = {
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
