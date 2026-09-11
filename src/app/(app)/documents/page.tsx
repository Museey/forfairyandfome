import Link from "next/link";
import { Plus } from "lucide-react";
import { TabBar } from "@/components/tab-bar";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentSearch } from "@/components/documents/document-search";
import { OverviewTables } from "@/components/documents/overview-table";
import { Pagination } from "@/components/documents/pagination";
import { PayslipCard } from "@/components/documents/payslip-card";
import { TimesheetCard } from "@/components/documents/timesheet-card";
import { TaxDocumentList } from "@/components/documents/tax-document-list";
import { TaxDocumentUploader } from "@/components/documents/tax-document-uploader";
import { loadDocumentOverview } from "@/lib/documents-overview";
import {
  loadDocumentPage,
  loadPayslipPage,
  loadTaxDocumentPage,
  loadTimesheetPage,
} from "@/lib/documents-list";
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

/** What each tab's search box says it will match. */
const SEARCH_PLACEHOLDER: Partial<Record<TabKey, string>> = {
  quotations: "ค้นหาแบรนด์ ชื่องาน เลขที่ หรือผู้ซื้อ",
  invoices: "ค้นหาแบรนด์ ชื่องาน เลขที่ หรือผู้ซื้อ",
  receipts: "ค้นหาแบรนด์ ชื่องาน เลขที่ หรือผู้ซื้อ",
  payslips: "ค้นหาเดือน ปี ชื่อพนักงาน หรือเลขที่",
  timesheets: "ค้นหาเดือน ปี ชื่อพนักงาน หรือเลขที่",
  wht: "ค้นหาแบรนด์ ชื่องาน หรือหมายเหตุ",
  pp30: "ค้นหาเดือน ปี หรือหมายเหตุ",
  "purchase-sales": "ค้นหาเดือน ปี หรือหมายเหตุ",
  pnd90: "ค้นหาปี หรือหมายเหตุ",
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
  const tab = (
    TABS.some((t) => t.key === requested) ? requested : "overview"
  ) as TabKey;

  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(
    1,
    Number(typeof sp.page === "string" ? sp.page : 1) || 1,
  );

  const documentType = DOCUMENT_TAB[tab];
  const taxType = TAX_TAB[tab];
  const now = bangkokYearMonth(new Date());

  // Exactly one tab is on screen, so only its own query runs.
  const overview = tab === "overview" ? await loadDocumentOverview() : null;
  const documents = documentType
    ? await loadDocumentPage(documentType, query, page)
    : null;
  const payslips = tab === "payslips" ? await loadPayslipPage(query, page) : null;
  const timesheets =
    tab === "timesheets" ? await loadTimesheetPage(query, page) : null;
  const taxDocuments = taxType
    ? await loadTaxDocumentPage(taxType, query, page)
    : null;

  const totalPages =
    documents?.totalPages ??
    payslips?.totalPages ??
    timesheets?.totalPages ??
    taxDocuments?.totalPages ??
    0;

  function hrefFor(n: number) {
    const params = new URLSearchParams({ tab });
    if (query) params.set("q", query);
    if (n > 1) params.set("page", String(n));
    return `/documents?${params}`;
  }

  const placeholder = SEARCH_PLACEHOLDER[tab];
  const notFound = `ไม่พบเอกสารที่ตรงกับ "${query}"`;

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2">
      <h1 className="text-xl font-semibold">เอกสาร</h1>

      <TabBar basePath="/documents" active={tab} tabs={[...TABS]} />

      <div className="flex flex-col gap-3 pb-6">
        {overview && <OverviewTables months={overview} />}

        {placeholder && <DocumentSearch placeholder={placeholder} />}

        {documents &&
          (documents.items.length === 0 ? (
            <Empty>{query ? notFound : "ยังไม่มีเอกสารประเภทนี้"}</Empty>
          ) : (
            documents.items.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          ))}

        {payslips && (
          <>
            <Link href="/documents/payslips/new" className={CREATE_BUTTON}>
              <Plus className="h-4 w-4" />
              สร้างเอกสาร
            </Link>
            {payslips.items.length === 0 ? (
              <Empty>{query ? notFound : "ยังไม่มีสลิปเงินเดือน"}</Empty>
            ) : (
              payslips.items.map((payslip) => (
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
            {timesheets.items.length === 0 ? (
              <Empty>{query ? notFound : "ยังไม่มี Time sheet"}</Empty>
            ) : (
              timesheets.items.map((timesheet) => (
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
            {taxDocuments.items.length === 0 && query ? (
              <Empty>{notFound}</Empty>
            ) : (
              <TaxDocumentList documents={taxDocuments.items} />
            )}
          </>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
