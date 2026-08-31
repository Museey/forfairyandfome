"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { PostItem } from "@/components/timeline/post-item";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { FeedItem } from "@/lib/feed";

export function HistoryPost({
  item,
  defaultOpen = false,
  onDelete,
}: {
  item: FeedItem;
  defaultOpen?: boolean;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border bg-bg">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-faint transition",
              open && "rotate-180",
            )}
          />
          <span className="truncate text-sm">{formatDate(item.createdAt)}</span>
          {item.body && (
            <span className="min-w-0 flex-1 truncate text-xs text-text-faint">
              {item.body}
            </span>
          )}
        </button>
        <form action={onDelete} className="shrink-0 pr-2">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label="ลบ"
            className="p-1.5 text-text-faint transition active:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {open && (
        <div className="border-t border-border p-2">
          <PostItem item={item} />
        </div>
      )}
    </div>
  );
}
