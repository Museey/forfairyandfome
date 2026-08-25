"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function PhotoAttachment({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-2 block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="max-h-72 w-full rounded-xl object-cover"
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
