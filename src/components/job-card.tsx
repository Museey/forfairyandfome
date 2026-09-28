import Link from "next/link";
import type { Job } from "@/generated/prisma/client";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateShort } from "@/lib/date";
import { nextMilestone } from "@/lib/job-dates";
import { formatJobMonth } from "@/lib/job-number";
import { FreeJobTag } from "@/components/job-kind-picker";

export function JobCard({ job }: { job: Job }) {
  const milestone = nextMilestone(job);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-card border border-border bg-card px-4 py-4 transition active:scale-[0.99] active:bg-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-text-muted">
            {job.brandName}
            {job.productName ? ` · ${job.productName}` : ""}
          </p>
          <h3 className="mt-0.5 truncate text-base font-medium">
            {job.title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={job.status} />
          {job.kind === "FREE" && <FreeJobTag />}
        </div>
      </div>
      {(milestone || job.monthlySeq) && (
        <p className="mt-3 text-xs text-text-faint">
          {job.monthlySeq &&
            `งานที่ ${job.monthlySeq} · ${formatJobMonth(job.createdAt)}`}
          {job.monthlySeq && milestone && " — "}
          {milestone &&
            `${milestone.label} · ${formatDateShort(milestone.date)}`}
        </p>
      )}
    </Link>
  );
}
