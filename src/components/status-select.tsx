"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { JOB_STATUS_LABEL } from "@/lib/job-status";
import type { JobStatus } from "@/generated/prisma/enums";
import { updateJobStatus } from "@/app/(app)/jobs/actions";

export function StatusSelect({
  jobId,
  status,
  statuses,
}: {
  jobId: string;
  status: JobStatus;
  /** The statuses this job can move through. */
  statuses: JobStatus[];
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
      {statuses.map((s) => (
        <option key={s} value={s}>
          {JOB_STATUS_LABEL[s]}
        </option>
      ))}
    </Select>
  );
}
