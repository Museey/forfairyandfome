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
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        lang="en-CA"
        className="w-full min-w-0 pr-9"
        defaultValue={defaultValue}
      />
      <button
        type="button"
        aria-label="ล้างวันที่"
        onClick={() => {
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-faint active:bg-border"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
