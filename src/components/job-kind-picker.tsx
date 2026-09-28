import { cn } from "@/lib/cn";
import { JOB_KIND_HINT, JOB_KIND_LABEL, JOB_KIND_ORDER } from "@/lib/job-kind";
import type { JobKind } from "@/generated/prisma/enums";

/** Two radio cards posting `kind` with the form they sit in. */
export function JobKindPicker({
  defaultValue = "STANDARD",
  freeDisabledReason,
}: {
  defaultValue?: JobKind;
  /** When set, งานฟรี can't be picked and this says why. */
  freeDisabledReason?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {JOB_KIND_ORDER.map((kind) => {
        const disabled = kind === "FREE" && !!freeDisabledReason;
        return (
          <label
            key={kind}
            className="cursor-pointer rounded-2xl border border-border bg-card px-4 py-3 transition has-[:checked]:border-teal/60 has-[:checked]:bg-teal-soft has-[:checked]:ring-1 has-[:checked]:ring-teal/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              defaultChecked={kind === defaultValue}
              disabled={disabled}
              className="sr-only"
            />
            <span className="block text-sm font-medium">
              {JOB_KIND_LABEL[kind]}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              {disabled ? freeDisabledReason : JOB_KIND_HINT[kind]}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Small tag marking a free job next to its title. */
export function FreeJobTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-text-muted",
        className,
      )}
    >
      {JOB_KIND_LABEL.FREE}
    </span>
  );
}
