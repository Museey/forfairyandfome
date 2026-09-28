import type { TaxDocPart, TaxDocType } from "@/generated/prisma/enums";

export const TAX_DOC_LABEL: Record<TaxDocType, string> = {
  WHT: "WHT",
  PP30: "ภ.พ.30",
  PND1: "ภ.ง.ด.1",
  PURCHASE_SALES_TAX: "ภาษีซื้อ-ขาย",
  PND90: "ภ.ง.ด.90",
};

/**
 * What one filing covers: WHT is filed against a job, three are monthly,
 * and ภ.ง.ด.90 is annual. The upload form asks for exactly the period this
 * names.
 */
export const TAX_DOC_PERIOD: Record<TaxDocType, "JOB" | "MONTH" | "YEAR"> = {
  WHT: "JOB",
  PP30: "MONTH",
  PND1: "MONTH",
  PURCHASE_SALES_TAX: "MONTH",
  PND90: "YEAR",
};

export const TAX_DOC_ORDER: TaxDocType[] = [
  "WHT",
  "PP30",
  "PND1",
  "PURCHASE_SALES_TAX",
  "PND90",
];

const PARTS: TaxDocPart[] = ["FORM", "RECEIPT"];

/**
 * The halves a month's filing is made of, for the types filed as a form
 * plus its receipt — one file each. Every other type has none: any number
 * of files, no halves.
 */
export function taxDocParts(type: TaxDocType): TaxDocPart[] {
  return type === "PP30" || type === "PND1" ? PARTS : [];
}

/** "แบบ ภ.พ.30" or "ใบเสร็จรับเงิน". */
export function taxDocPartLabel(type: TaxDocType, part: TaxDocPart) {
  return part === "FORM" ? `แบบ ${TAX_DOC_LABEL[type]}` : "ใบเสร็จรับเงิน";
}
