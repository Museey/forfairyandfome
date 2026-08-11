"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import type { DocumentStatus } from "@/generated/prisma/enums";
import { DOCUMENT_STATUS_LABEL } from "@/lib/document";
import { updateDocumentStatus } from "@/app/(app)/jobs/[id]/document-actions";

const ORDER: DocumentStatus[] = ["DRAFT", "SENT", "PAID"];

export function DocumentStatusSelect({
  docId,
  jobId,
  status,
}: {
  docId: string;
  jobId: string;
  status: DocumentStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as DocumentStatus;
        startTransition(() => updateDocumentStatus(docId, jobId, next));
      }}
    >
      {ORDER.map((s) => (
        <option key={s} value={s}>
          {DOCUMENT_STATUS_LABEL[s]}
        </option>
      ))}
    </Select>
  );
}
