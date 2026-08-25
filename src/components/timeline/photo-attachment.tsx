"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function PhotoAttachment({
  url,
  variant = "single",
}: {
  url: string;
  variant?: "single" | "grid";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("block", variant === "single" ? "mt-2 w-full" : "aspect-square w-full")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className={cn(
            "w-full object-cover",
            variant === "single" ? "max-h-72 rounded-xl" : "h-full rounded-md",
          )}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิด"
            className="pt-safe absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
