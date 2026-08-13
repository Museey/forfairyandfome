"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/field";

export function ClearableDateInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        lang="en-CA"
        className="min-w-0 flex-1"
        defaultValue={defaultValue}
      />
      <button
        type="button"
        aria-label="ล้างวันที่"
        onClick={() => {
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="shrink-0 rounded-full p-1.5 text-text-faint active:bg-border"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
