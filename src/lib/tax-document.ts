import type { TaxDocType } from "@/generated/prisma/enums";

export const TAX_DOC_LABEL: Record<TaxDocType, string> = {
  WHT: "WHT",
  PP30: "ภ.พ.30",
  PURCHASE_SALES_TAX: "ภาษีซื้อ-ขาย",
  PND90: "ภ.ง.ด.90",
};

/**
 * What one filing covers, which is the only thing that differs between the
 * four: WHT is filed against a job, two are monthly, and ภ.ง.ด.90 is annual.
 * The upload form asks for exactly the period this names.
 */
export const TAX_DOC_PERIOD: Record<TaxDocType, "JOB" | "MONTH" | "YEAR"> = {
  WHT: "JOB",
  PP30: "MONTH",
  PURCHASE_SALES_TAX: "MONTH",
  PND90: "YEAR",
};

export const TAX_DOC_ORDER: TaxDocType[] = [
  "WHT",
  "PP30",
  "PURCHASE_SALES_TAX",
  "PND90",
];
