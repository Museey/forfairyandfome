"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CalendarSubscribeLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="mb-2 break-all text-xs text-text-muted">{url}</p>
      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-teal/40 bg-teal-soft px-4 py-2.5 text-sm text-teal"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์ปฏิทิน"}
      </button>
      <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-text-faint">
        <li>เปิด Settings บน iPhone</li>
        <li>ไปที่ Calendar → Accounts → Add Account → Other</li>
        <li>เลือก Add Subscribed Calendar แล้ววางลิงก์ด้านบน</li>
      </ol>
    </div>
  );
}
