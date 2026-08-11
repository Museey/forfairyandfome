import type { JobStatus } from "@/generated/prisma/enums";
import { JOB_STATUS_COLOR, JOB_STATUS_SHORT_LABEL } from "@/lib/job-status";
import { cn } from "@/lib/cn";

export function StatusPill({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const color = JOB_STATUS_COLOR[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {JOB_STATUS_SHORT_LABEL[status]}
    </span>
  );
}
