import type { DocumentType, DocumentStatus } from "@/generated/prisma/enums";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  QUOTATION: "ใบเสนอราคา",
  INVOICE: "ใบแจ้งหนี้",
  RECEIPT: "ใบเสร็จรับเงิน",
};

export const DOCUMENT_TYPE_ORDER: DocumentType[] = ["QUOTATION", "INVOICE", "RECEIPT"];

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  DRAFT: "ฉบับร่าง",
  SENT: "ส่งแล้ว",
  PAID: "จ่ายแล้ว",
};

export const DOCUMENT_STATUS_COLOR: Record<DocumentStatus, string> = {
  DRAFT: "#8892B0",
  SENT: "#FFB703",
  PAID: "#4ADE80",
};

export type LineItem = {
  description: string;
  amount: number;
};

export function stripNullBytes(value: string) {
  return value.replace(/\u0000/g, "");
}

export function parseLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      description:
        typeof v.description === "string" ? stripNullBytes(v.description) : "",
      amount: typeof v.amount === "number" ? v.amount : Number(v.amount) || 0,
    }));
}

export const VAT_PERCENT = 7;

export function computeTotals(lineItems: LineItem[], withholdingTaxPercent: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const vat = Math.round(subtotal * (VAT_PERCENT / 100) * 100) / 100;
  const withholdingTax = Math.round(subtotal * (withholdingTaxPercent / 100) * 100) / 100;
  const net = subtotal + vat - withholdingTax;
  return { subtotal, vat, withholdingTax, net };
}

const THB_FORMATTER = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBaht(amount: number) {
  return THB_FORMATTER.format(amount);
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/** Thai business documents use the Buddhist Era (CE + 543), unlike the rest of the app UI. */
export function formatThaiBuddhistDate(date: Date) {
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function generateDocNumber(type: DocumentType, date: Date) {
  const prefix = type === "QUOTATION" ? "QT" : type === "INVOICE" ? "IV" : "RC";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}
