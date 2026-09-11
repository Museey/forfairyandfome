"use client";

import { useRef, useTransition } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/cn";

/**
 * One-file upload that submits as soon as a file is picked — used for signed
 * copies and for the tax forms we only ever file away. Photos are compressed
 * first: a phone snap of a signed page can easily exceed the ~4.5MB request
 * body limit on Vercel.
 */
export function UploadFileButton({
  action,
  fields,
  label,
  className,
  accept = "application/pdf,image/*",
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  className?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        for (const [key, value] of Object.entries(fields)) formData.set(key, value);
        formData.set("file", await compressImage(file));
        await action(formData);
      } catch {
        alert("แนบไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 disabled:opacity-60",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        {pending ? "กำลังอัปโหลด..." : label}
      </button>
    </>
  );
}
