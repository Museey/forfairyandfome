"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentType } from "@/generated/prisma/enums";
import { DOCUMENT_TYPE_LABEL, DOCUMENT_TYPE_ORDER } from "@/lib/document";
import { duplicateDocumentAs } from "@/app/(app)/jobs/[id]/document-actions";

export function DuplicateAsButtons({
  docId,
  jobId,
  currentType,
}: {
  docId: string;
  jobId: string;
  currentType: DocumentType;
}) {
  const [pending, startTransition] = useTransition();
  const otherTypes = DOCUMENT_TYPE_ORDER.filter((t) => t !== currentType);

  return (
    <div className="flex gap-2">
      {otherTypes.map((t) => (
        <Button
          key={t}
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => duplicateDocumentAs(docId, jobId, t))}
        >
          สร้างเป็น{DOCUMENT_TYPE_LABEL[t]}
        </Button>
      ))}
    </div>
  );
}
