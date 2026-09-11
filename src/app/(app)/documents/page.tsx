import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TabBar } from "@/components/tab-bar";
import { DocumentCard } from "@/components/documents/document-card";
import { OverviewTables } from "@/components/documents/overview-table";
import { PayslipCard } from "@/components/documents/payslip-card";
import { TimesheetCard } from "@/components/documents/timesheet-card";
import { TaxDocumentList } from "@/components/documents/tax-document-list";
import { TaxDocumentUploader } from "@/components/documents/tax-document-uploader";
import { loadDocumentOverview } from "@/lib/documents-overview";
import { bangkokYearMonth } from "@/lib/timezone";
import type { DocumentType, TaxDocType } from "@/generated/prisma/enums";

const TABS = [
  { key: "overview", label: "เอกสารทั้งหมด" },
  { key: "quotations", label: "ใบเสนอราคา" },
  { key: "invoices", label: "ใบแจ้งหนี้" },
  { key: "receipts", label: "ใบเสร็จรับเงิน" },
  { key: "payslips", label: "สลิปเงินเดือน" },
  { key: "timesheets", label: "Time sheet" },
  { key: "wht", label: "WHT" },
  { key: "pp30", label: "ภ.พ.30" },
  { key: "purchase-sales", label: "ภาษีซื้อ/ขาย" },
  { key: "pnd90", label: "ภ.ง.ด.90" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DOCUMENT_TAB: Partial<Record<TabKey, DocumentType>> = {
  quotations: "QUOTATION",
  invoices: "INVOICE",
  receipts: "RECEIPT",
};

const TAX_TAB: Partial<Record<TabKey, TaxDocType>> = {
  wht: "WHT",
  pp30: "PP30",
  "purchase-sales": "PURCHASE_SALES_TAX",
  pnd90: "PND90",
};

const CREATE_BUTTON =
  "flex items-center justify-center gap-2 rounded-card border border-dashed border-border-strong py-3 text-sm font-medium text-text-muted transition active:bg-card";

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-text-faint">{children}</p>;
}

export default async function DocumentsPage({
  searchParams,
}: PageProps<"/documents">) {
  const sp = await searchParams;
  const requested = typeof sp.tab === "string" ? sp.tab : "";
  const tab = (TABS.some((t) => t.key === requested) ? requested : "overview") as TabKey;

  const documentType = DOCUMENT_TAB[tab];
  const taxType = TAX_TAB[tab];
  const now = bangkokYearMonth(new Date());

  const [overview, documents, payslips, timesheets, taxDocuments] = await Promise.all([
    tab === "overview" ? loadDocumentOverview() : null,
    documentType
      ? prisma.document.findMany({
          where: { type: documentType },
          include: { job: true },
          orderBy: { issueDate: "desc" },
        })
      : null,
    tab === "payslips"
      ? prisma.payslip.findMany({
          orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        })
      : null,
    tab === "timesheets"
      ? prisma.timesheet.findMany({
          orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        })
      : null,
    taxType
      ? prisma.taxDocument.findMany({
          where: { type: taxType },
          include: { job: true },
          orderBy: [
            { periodYear: "desc" },
            { periodMonth: "desc" },
            { createdAt: "desc" },
          ],
        })
      : null,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2">
      <h1 className="text-xl font-semibold">เอกสาร</h1>

      <TabBar basePath="/documents" active={tab} tabs={[...TABS]} />

      <div className="flex flex-col gap-3 pb-6">
        {overview && <OverviewTables months={overview} />}

        {documents &&
          (documents.length === 0 ? (
            <Empty>ยังไม่มีเอกสารประเภทนี้</Empty>
          ) : (
            documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          ))}

        {payslips && (
          <>
            <Link href="/documents/payslips/new" className={CREATE_BUTTON}>
              <Plus className="h-4 w-4" />
              สร้างเอกสาร
            </Link>
            {payslips.length === 0 ? (
              <Empty>ยังไม่มีสลิปเงินเดือน</Empty>
            ) : (
              payslips.map((payslip) => (
                <PayslipCard key={payslip.id} payslip={payslip} />
              ))
            )}
          </>
        )}

        {timesheets && (
          <>
            <Link href="/documents/timesheets/new" className={CREATE_BUTTON}>
              <Plus className="h-4 w-4" />
              สร้างเอกสาร
            </Link>
            {timesheets.length === 0 ? (
              <Empty>ยังไม่มี Time sheet</Empty>
            ) : (
              timesheets.map((timesheet) => (
                <TimesheetCard key={timesheet.id} timesheet={timesheet} />
              ))
            )}
          </>
        )}

        {taxDocuments && taxType && (
          <>
            {taxType === "WHT" ? (
              <p className="rounded-card border border-border bg-card p-3.5 text-xs text-text-muted">
                WHT แนบเป็นราย Job — เปิดงานที่ต้องการ แล้วแนบในแท็บเอกสารของงานนั้น
              </p>
            ) : (
              <TaxDocumentUploader
                type={taxType}
                scope={taxType === "PND90" ? "YEAR" : "MONTH"}
                defaultPeriod={`${now.year}-${String(now.month).padStart(2, "0")}`}
                defaultYear={now.year}
              />
            )}
            <TaxDocumentList documents={taxDocuments} />
          </>
        )}
      </div>
    </div>
  );
}
