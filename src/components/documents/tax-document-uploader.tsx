"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { UploadFileButton } from "@/components/documents/upload-file-button";
import { uploadTaxDocument } from "@/app/(app)/documents/actions";
import type { TaxDocType } from "@/generated/prisma/enums";

/**
 * Attaching one of the monthly/annual tax filings. WHT isn't here on purpose:
 * it's filed against a job, so it's attached from that job's เอกสาร tab.
 */
export function TaxDocumentUploader({
  type,
  scope,
  defaultPeriod,
  defaultYear,
}: {
  type: TaxDocType;
  scope: "MONTH" | "YEAR";
  defaultPeriod: string;
  defaultYear: number;
}) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [year, setYear] = useState(String(defaultYear));

  return (
    <div className="flex items-center gap-2 rounded-card border border-dashed border-border-strong p-3">
      {scope === "MONTH" ? (
        <Input
          type="month"
          lang="en-CA"
          aria-label="เดือนของเอกสาร"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="min-w-0 flex-1"
        />
      ) : (
        <Input
          type="number"
          aria-label="ปีของเอกสาร"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="min-w-0 flex-1"
        />
      )}

      <UploadFileButton
        action={uploadTaxDocument}
        fields={
          scope === "MONTH"
            ? { type, period }
            : { type, periodYear: year }
        }
        label="แนบเอกสาร"
        className="shrink-0 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-2.5 text-sm font-medium text-teal"
      />
    </div>
  );
}
