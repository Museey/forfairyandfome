import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** At most this many numbered pages around the current one. */
const WINDOW = 5;

function pageNumbers(current: number, total: number) {
  const start = Math.max(1, Math.min(current - Math.floor(WINDOW / 2), total - WINDOW + 1));
  const count = Math.min(WINDOW, total);
  return Array.from({ length: count }, (_, i) => Math.max(1, start) + i);
}

const BUTTON =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border px-2.5 text-sm";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  /** Builds the URL for a page, preserving the tab and search query. */
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-1" aria-label="หน้า">
      <Link
        href={hrefFor(page - 1)}
        aria-label="ก่อนหน้า"
        aria-disabled={page === 1}
        className={cn(BUTTON, page === 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pageNumbers(page, totalPages).map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            BUTTON,
            n === page
              ? "border-teal bg-teal-soft font-medium text-teal"
              : "text-text-muted",
          )}
        >
          {n}
        </Link>
      ))}

      <Link
        href={hrefFor(page + 1)}
        aria-label="ถัดไป"
        aria-disabled={page === totalPages}
        className={cn(BUTTON, page === totalPages && "pointer-events-none opacity-40")}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
