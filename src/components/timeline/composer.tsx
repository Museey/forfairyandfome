"use client";

import { useRef, useState, useTransition } from "react";
import { Image as ImageIcon, Link as LinkIcon, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function Composer({
  jobId,
  action,
  placeholder,
}: {
  jobId?: string;
  action: (formData: FormData) => Promise<void>;
  placeholder: string;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [pending, startTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = body.trim() || files.length > 0 || link.trim();

  function reset() {
    setBody("");
    setFiles([]);
    setLink("");
    setShowLink(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!canSubmit || pending) return;
    const formData = new FormData();
    if (jobId) formData.set("jobId", jobId);
    formData.set("body", body.trim());
    for (const file of files) formData.append("files", file);
    if (link.trim()) formData.set("link", link.trim());

    startTransition(async () => {
      await action(formData);
      reset();
    });
  }

  return (
    <div className="rounded-card border border-border bg-card p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-text-faint"
      />

      {showLink && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none placeholder:text-text-faint focus:border-teal/60"
          />
          <button
            type="button"
            onClick={() => {
              setShowLink(false);
              setLink("");
            }}
            className="shrink-0 text-text-faint"
            aria-label="ลบลิงก์"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {files.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2"
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <Paperclip className="h-4 w-4 text-text-faint" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-text-faint"
                  aria-label="ลบไฟล์"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={addFiles}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={addFiles}
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className={cn(
              "rounded-full p-2 transition",
              files.some((f) => f.type.startsWith("image/"))
                ? "text-teal"
                : "text-text-faint",
            )}
            aria-label="แนบรูปภาพ"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-full p-2 transition",
              files.some((f) => !f.type.startsWith("image/"))
                ? "text-teal"
                : "text-text-faint",
            )}
            aria-label="แนบไฟล์"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowLink((prev) => !prev)}
            className={cn(
              "rounded-full p-2 transition",
              showLink ? "text-teal" : "text-text-faint",
            )}
            aria-label="แนบลิงก์"
          >
            <LinkIcon className="h-5 w-5" />
          </button>
        </div>
        <Button
          size="sm"
          disabled={!canSubmit || pending}
          onClick={submit}
        >
          {pending ? "กำลังโพสต์..." : "โพสต์"}
        </Button>
      </div>
    </div>
  );
}
