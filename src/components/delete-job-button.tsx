"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteJob } from "@/app/(app)/jobs/actions";
import { Button } from "@/components/ui/button";

export function DeleteJobButton({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirmDelete() {
    startTransition(async () => {
      await deleteJob(jobId);
      router.push("/jobs");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? "กำลังลบ..." : "ลบงานนี้"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
            className="w-full max-w-sm rounded-card border border-border bg-card p-4 shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 id="delete-job-title" className="text-sm font-semibold text-text">
                ยืนยันการลบงาน
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="ปิด"
                className="rounded-full p-1.5 text-text-faint active:scale-95 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-text-muted">
              ลบงาน &quot;{jobTitle}&quot; ถาวร? ข้อมูลทั้งหมด (ไทม์ไลน์, Storyline, เอกสาร)
              จะถูกลบไปด้วย
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="w-full"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirmDelete}
                disabled={pending}
                className="w-full"
              >
                {pending ? "กำลังลบ..." : "ลบงาน"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
