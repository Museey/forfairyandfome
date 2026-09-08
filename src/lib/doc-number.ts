import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/timezone";
import type { DocumentType } from "@/generated/prisma/enums";

const DOC_NUMBER_PREFIX: Record<DocumentType, string> = {
  QUOTATION: "QT",
  INVOICE: "INV",
  RECEIPT: "RC",
};

const SEQUENCE_DIGITS = 3;

/** "YYYYMMDD" for the issue date, read in Bangkok time. */
function datePart(date: Date) {
  return bangkokDateKey(date).replaceAll("-", "");
}

export function formatDocNumber(
  type: DocumentType,
  date: Date,
  sequence: number,
) {
  const seq = String(sequence).padStart(SEQUENCE_DIGITS, "0");
  return `${DOC_NUMBER_PREFIX[type]}-${datePart(date)}-${seq}`;
}

/**
 * Next number for a document, e.g. INV-20260908-001. The sequence runs per
 * document type and restarts each month. It comes from the highest number
 * already issued that month rather than a count, so deleting a document from
 * the middle of the month leaves a gap instead of handing its number to the
 * next document (deleting the most recent one does free that number again).
 *
 * Two documents of the same type created in the very same moment could still
 * race onto one number; with two people issuing documents by hand that hasn't
 * been worth a database-level sequence.
 */
export async function nextDocNumber(type: DocumentType, issueDate: Date) {
  const monthPrefix = `${DOC_NUMBER_PREFIX[type]}-${datePart(issueDate).slice(0, 6)}`;

  const issued = await prisma.document.findMany({
    where: { docNumber: { startsWith: monthPrefix } },
    select: { docNumber: true },
  });

  const highest = issued.reduce((max, { docNumber }) => {
    // Ignore anything that isn't PREFIX-YYYYMMDD-NNN (documents issued before
    // running numbers used a random suffix).
    const sequence = Number(docNumber.split("-")[2]);
    return Number.isInteger(sequence) && sequence > max ? sequence : max;
  }, 0);

  return formatDocNumber(type, issueDate, highest + 1);
}
