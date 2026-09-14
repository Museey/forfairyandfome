"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { removeSignedCopy } from "@/app/(app)/jobs/[id]/document-actions";

/**
 * Takes the signed scan off a document, putting it back to รอแนบ. The file
 * is deleted from storage rather than just unlinked, so it asks first.
 */
export function RemoveSignedCopyButton({ docId }: { docId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("ลบไฟล์ฉบับเซ็นและยกเลิกสถานะเซ็นแล้ว?")) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("docId", docId);
        await removeSignedCopy(formData);
      } catch {
        alert("ลบไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="ลบไฟล์ฉบับเซ็น"
      className="shrink-0 rounded-full p-1.5 text-text-faint transition active:text-danger disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
