"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteJob } from "@/app/(app)/jobs/actions";

export function DeleteJobButton({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`ลบงาน "${jobTitle}" ถาวร? ข้อมูลทั้งหมด (ไทม์ไลน์, storyline, เอกสาร) จะถูกลบไปด้วย`)) {
      return;
    }
    startTransition(async () => {
      await deleteJob(jobId);
      router.push("/jobs");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "กำลังลบ..." : "ลบงานนี้"}
    </button>
  );
}
