"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function PdfExportButton({
  url,
  filename,
  className,
}: {
  url: string;
  filename: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("failed to fetch pdf");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        alert("ไม่สามารถส่งออก PDF ได้ ลองใหม่อีกครั้ง");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(className, "disabled:opacity-60")}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {pending ? "กำลังเตรียมไฟล์..." : "ส่งออก PDF"}
    </button>
  );
}
