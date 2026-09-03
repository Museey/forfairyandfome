"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function WidgetSetupLink({ url }: { url: string }) {
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
        {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์ Widget"}
      </button>
      <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-text-faint">
        <li>ติดตั้งแอป Scriptable จาก App Store</li>
        <li>
          เปิดแอป กด + แล้ววางสคริปต์จากไฟล์ scriptable/fairy-fome-widget.js
        </li>
        <li>แก้ WIDGET_URL ในสคริปต์ให้เป็นลิงก์ด้านบน แล้วตั้งชื่อสคริปต์</li>
        <li>
          ที่หน้าโฮม กดค้าง → + → Scriptable → เลือกขนาด → กดค้างที่ widget →
          Edit Widget → เลือกสคริปต์นี้
        </li>
      </ol>
      <p className="mt-2 text-xs text-text-faint">
        iOS เป็นคนกำหนดรอบรีเฟรชเอง (ปกติ 15–30 นาที) ของด่วนยังต้องดูจากการแจ้งเตือน
      </p>
    </div>
  );
}
