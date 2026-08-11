"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { JOB_STATUS_ORDER, JOB_STATUS_LABEL } from "@/lib/job-status";
import type { JobStatus } from "@/generated/prisma/enums";
import { updateJobStatus } from "@/app/(app)/jobs/actions";

export function StatusSelect({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as JobStatus;
        startTransition(() => {
          updateJobStatus(jobId, next);
        });
      }}
    >
      {JOB_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {JOB_STATUS_LABEL[s]}
        </option>
      ))}
    </Select>
  );
}
