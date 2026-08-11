"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/date";
import { emptyScene, formatScenesAsText, type StorylineScene } from "@/lib/storyline";
import {
  approveStoryline,
  saveStorylineDraft,
  sendStoryline,
} from "@/app/(app)/jobs/[id]/storyline-actions";

type StorylineStatus = "DRAFT" | "SENT" | "APPROVED";

const STATUS_LABEL: Record<StorylineStatus, string> = {
  DRAFT: "ฉบับร่าง",
  SENT: "ส่งให้ลูกค้าแล้ว รออนุมัติ",
  APPROVED: "ลูกค้าอนุมัติแล้ว",
};

const STATUS_COLOR: Record<StorylineStatus, string> = {
  DRAFT: "#8892B0",
  SENT: "#FFB703",
  APPROVED: "#4ADE80",
};

export function StorylineEditor({
  jobId,
  initialScenes,
  status,
  sentAt,
  approvedAt,
}: {
  jobId: string;
  initialScenes: StorylineScene[];
  status: StorylineStatus;
  sentAt: Date | null;
  approvedAt: Date | null;
}) {
  const [scenes, setScenes] = useState<StorylineScene[]>(() =>
    initialScenes.length > 0 ? initialScenes : [emptyScene()],
  );
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function updateScene(id: string, field: keyof StorylineScene, value: string) {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function removeScene(id: string) {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }

  function addScene() {
    setScenes((prev) => [...prev, emptyScene()]);
  }

  function moveScene(index: number, direction: -1 | 1) {
    setScenes((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSaveDraft() {
    startTransition(() => saveStorylineDraft(jobId, scenes));
  }

  function handleSend() {
    startTransition(() => sendStoryline(jobId, scenes));
  }

  function handleApprove() {
    startTransition(() => approveStoryline(jobId));
  }

  function copyWithFallback(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function handleCopy() {
    const text = formatScenesAsText(scenes);
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error("clipboard api unavailable");
      }
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        copyWithFallback(text);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between rounded-card border border-border bg-card px-4 py-3">
        <div>
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: STATUS_COLOR[status] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[status] }}
            />
            {STATUS_LABEL[status]}
          </span>
          {status === "SENT" && sentAt && (
            <p className="mt-0.5 text-xs text-text-faint">
              ส่งเมื่อ {formatDateTime(sentAt)}
            </p>
          )}
          {status === "APPROVED" && approvedAt && (
            <p className="mt-0.5 text-xs text-text-faint">
              อนุมัติเมื่อ {formatDateTime(approvedAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                คัดลอกข้อความ
              </>
            )}
          </Button>
          {status === "SENT" && (
            <Button size="sm" disabled={pending} onClick={handleApprove}>
              อนุมัติ Storyline
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="rounded-card border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-teal">
                ซีนที่ {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveScene(index, -1)}
                  className="rounded-full p-1.5 text-text-faint disabled:opacity-30"
                  aria-label="เลื่อนขึ้น"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === scenes.length - 1}
                  onClick={() => moveScene(index, 1)}
                  className="rounded-full p-1.5 text-text-faint disabled:opacity-30"
                  aria-label="เลื่อนลง"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeScene(scene.id)}
                  className="rounded-full p-1.5 text-text-faint transition active:text-danger"
                  aria-label="ลบซีนนี้"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <Label>ซีน (บรรยายภาพ)</Label>
                <Textarea
                  rows={2}
                  value={scene.scene}
                  onChange={(e) => updateScene(scene.id, "scene", e.target.value)}
                  placeholder="เช่น ซีนพูดหน้ากล้อง"
                />
              </div>
              <div>
                <Label>Voice</Label>
                <Textarea
                  rows={2}
                  value={scene.voice}
                  onChange={(e) => updateScene(scene.id, "voice", e.target.value)}
                  placeholder="บทพูด / เสียงบรรยาย"
                />
              </div>
              <div>
                <Label>Text (ข้อความบนจอ)</Label>
                <Textarea
                  rows={2}
                  value={scene.text}
                  onChange={(e) => updateScene(scene.id, "text", e.target.value)}
                  placeholder="ข้อความที่ขึ้นบนวิดีโอ"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addScene}
        className="flex items-center justify-center gap-2 rounded-card border border-dashed border-border-strong py-3 text-sm text-text-muted transition active:bg-card"
      >
        <Plus className="h-4 w-4" />
        เพิ่มซีน
      </button>

      <div
        className={cn(
          "sticky bottom-0 mt-2 flex gap-2 rounded-card border border-border bg-card p-3 backdrop-blur",
        )}
      >
        <Button
          variant="secondary"
          className="flex-1"
          disabled={pending}
          onClick={handleSaveDraft}
        >
          บันทึกแบบร่าง
        </Button>
        <Button className="flex-1" disabled={pending} onClick={handleSend}>
          บันทึกและส่งให้ลูกค้า
        </Button>
      </div>
    </div>
  );
}
