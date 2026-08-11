"use client";

import { useRef, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addProductImage, removeProductImage } from "@/app/(app)/jobs/[id]/details-of-work-actions";

export function ProductImageGallery({
  jobId,
  images,
}: {
  jobId: string;
  images: string[];
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("file", file);
    startTransition(async () => {
      await addProductImage(formData);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onRemove(url: string) {
    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("url", url);
    startTransition(() => removeProductImage(formData));
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {images.map((url) => (
        <div
          key={url}
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(url)}
            disabled={pending}
            className="absolute right-1 top-1 rounded-full bg-bg/80 p-1 text-text"
            aria-label="ลบรูป"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong text-text-faint disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
        <span className="text-[11px]">เพิ่มรูป</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
