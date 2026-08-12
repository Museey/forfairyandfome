import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_ORDER, JOB_STATUS_SHORT_LABEL } from "@/lib/job-status";
import type { JobStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 10;

function buildQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export default async function JobsPage({
  searchParams,
}: PageProps<"/jobs">) {
  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const status =
    statusParam && (JOB_STATUS_ORDER as string[]).includes(statusParam)
      ? (statusParam as JobStatus)
      : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { brandName: { contains: q, mode: "insensitive" as const } },
            { productName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">งานทั้งหมด</h1>
        <Link href="/jobs/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            งานใหม่
          </Button>
        </Link>
      </div>

      <form className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่องาน, แบรนด์, สินค้า"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none placeholder:text-text-faint focus:border-teal/60 focus:ring-1 focus:ring-teal/40"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link
          href={buildQuery({ q })}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition",
            !status
              ? "border-teal/50 bg-teal-soft text-teal"
              : "border-border text-text-muted",
          )}
        >
          ทั้งหมด
        </Link>
        {JOB_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={buildQuery({ q, status: s })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition",
              status === s
                ? "border-teal/50 bg-teal-soft text-teal"
                : "border-border text-text-muted",
            )}
          >
            {JOB_STATUS_SHORT_LABEL[s]}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center text-text-faint">
          <p>ยังไม่มีงานในหมวดนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <Link
            aria-disabled={page <= 1}
            href={buildQuery({ q, status, page: String(page - 1) })}
            className={cn(
              "rounded-xl border border-border px-4 py-2",
              page <= 1 && "pointer-events-none opacity-30",
            )}
          >
            ก่อนหน้า
          </Link>
          <span className="text-text-faint">
            หน้า {page} / {totalPages}
          </span>
          <Link
            aria-disabled={page >= totalPages}
            href={buildQuery({ q, status, page: String(page + 1) })}
            className={cn(
              "rounded-xl border border-border px-4 py-2",
              page >= totalPages && "pointer-events-none opacity-30",
            )}
          >
            ถัดไป
          </Link>
        </div>
      )}
    </div>
  );
}
