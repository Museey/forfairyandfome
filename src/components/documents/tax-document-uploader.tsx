"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { UploadFileButton } from "@/components/documents/upload-file-button";
import { uploadTaxDocument } from "@/app/(app)/documents/actions";
import type { TaxDocPart, TaxDocType } from "@/generated/prisma/enums";

const BUTTON =
  "shrink-0 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-2.5 text-sm font-medium text-teal";

/**
 * Attaching one of the monthly/annual tax filings. WHT isn't here on purpose:
 * it's filed against a job, so it's attached from that job's เอกสาร tab.
 * A form-plus-receipt type passes `parts` and gets one button per half.
 */
export function TaxDocumentUploader({
  type,
  scope,
  defaultPeriod,
  defaultYear,
  parts = [],
  filled = [],
}: {
  type: TaxDocType;
  scope: "MONTH" | "YEAR";
  defaultPeriod: string;
  defaultYear: number;
  parts?: { part: TaxDocPart; label: string }[];
  /** "YYYY-MM:PART" for every half that already has its one file. */
  filled?: string[];
}) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [year, setYear] = useState(String(defaultYear));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-dashed border-border-strong p-3">
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

      {parts.length === 0 ? (
        <UploadFileButton
          action={uploadTaxDocument}
          fields={
            scope === "MONTH"
              ? { type, period }
              : { type, periodYear: year }
          }
          label="แนบเอกสาร"
          className={BUTTON}
        />
      ) : (
        <div className="flex w-full gap-2">
          {parts.map(({ part, label }) => {
            const done = filled.includes(`${period}:${part}`);
            return (
              <UploadFileButton
                key={part}
                action={uploadTaxDocument}
                fields={{ type, period, part }}
                label={done ? `${label} แนบแล้ว` : label}
                disabled={done}
                className={cn(BUTTON, "flex-1")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
