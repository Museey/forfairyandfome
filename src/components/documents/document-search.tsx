"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Search box for the document tabs. The query lives in the URL so the server
 * component does the filtering — which keeps the result shareable and the
 * back button meaningful. Typing is debounced so each keystroke isn't a
 * round trip, and any change drops you back to page 1.
 */
export function DocumentSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Follow the URL when it changes from the outside (tab switch, back button)
  // rather than keeping a stale local value.
  const urlQuery = searchParams.get("q") ?? "";
  const lastPushed = useRef(urlQuery);
  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setValue(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (value === lastPushed.current) return;

    const timer = setTimeout(() => {
      lastPushed.current = value;
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params}`, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-faint" />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-2xl border border-border bg-card py-3 pr-10 pl-10 text-sm outline-none placeholder:text-text-faint focus:border-border-strong"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="ล้างคำค้นหา"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1.5 text-text-faint active:bg-border"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
