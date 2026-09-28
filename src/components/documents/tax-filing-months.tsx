import { FileCheck2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/date";
import { formatMonthLabel } from "@/lib/document";
import { taxDocPartLabel, taxDocParts } from "@/lib/tax-document";
import { deleteTaxDocument, uploadTaxDocument } from "@/app/(app)/documents/actions";
import { UploadFileButton } from "@/components/documents/upload-file-button";
import type { TaxFilingMonth } from "@/lib/documents-list";
import type { TaxDocType } from "@/generated/prisma/enums";

/**
 * ภ.พ.30 / ภ.ง.ด.1, one card per month with a slot for the form and one
 * for its receipt. An empty slot is its own upload button.
 */
export function TaxFilingMonths({
  type,
  months,
}: {
  type: TaxDocType;
  months: TaxFilingMonth[];
}) {
  if (months.length === 0) {
    return <p className="py-8 text-center text-sm text-text-faint">ยังไม่มีเอกสารแนบ</p>;
  }

  const parts = taxDocParts(type);

  return (
    <div className="flex flex-col gap-3">
      {months.map(({ year, month, documents }) => {
        const period = `${year}-${String(month).padStart(2, "0")}`;
        return (
          <section
            key={period}
            className="rounded-card border border-border bg-card p-3.5"
          >
            <h2 className="mb-2 text-sm font-medium">
              {formatMonthLabel(year, month)}
            </h2>

            <div className="flex flex-col divide-y divide-border">
              {parts.map((part) => {
                // Filings from before a type had halves count as the form.
                const files = documents.filter((d) => (d.part ?? "FORM") === part);
                const label = taxDocPartLabel(type, part);
                return (
                  <div key={part} className="flex flex-col gap-1.5 py-2.5">
                    {files.length === 0 ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-text-muted">{label}</span>
                        <UploadFileButton
                          action={uploadTaxDocument}
                          fields={{ type, period, part }}
                          label="แนบไฟล์"
                          className="shrink-0 rounded-full border border-teal/40 bg-teal-soft px-3 py-1.5 text-xs font-medium text-teal"
                        />
                      </div>
                    ) : (
                      files.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3">
                          <FileCheck2 className="h-5 w-5 shrink-0 text-teal" />
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 flex-1"
                          >
                            <span className="block truncate text-sm font-medium">
                              {label}
                            </span>
                            <span className="block truncate text-xs text-text-faint">
                              {doc.note ? `${doc.note} · ` : ""}
                              แนบเมื่อ {formatDate(doc.createdAt)}
                            </span>
                          </a>
                          <form action={deleteTaxDocument} className="shrink-0">
                            <input type="hidden" name="id" value={doc.id} />
                            <button
                              type="submit"
                              aria-label={`ลบ${label}`}
                              className="rounded-full p-1.5 text-text-faint transition active:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
