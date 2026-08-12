"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function PdfPreviewButton({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Eye className="h-4 w-4" />
        ดูตัวอย่าง
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg">
          <div className="pt-safe flex items-center justify-between border-b border-border px-4 py-3">
            <span className="truncate text-sm font-medium">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิด"
              className={cn(
                "shrink-0 rounded-full p-2 text-text-faint transition active:scale-95",
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe src={url} title={title} className="w-full flex-1 border-0" />
        </div>
      )}
    </>
  );
}
