"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function TabBar({
  basePath,
  active,
  tabs,
}: {
  basePath: string;
  active: string;
  tabs: { key: string; label: string }[];
}) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  return (
    <div className="-mx-5 flex gap-1 overflow-x-auto border-b border-border px-5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            ref={isActive ? activeRef : undefined}
            href={`${basePath}?tab=${tab.key}`}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm transition",
              isActive
                ? "border-teal text-teal"
                : "border-transparent text-text-muted",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      <span className="shrink-0 px-2" aria-hidden />
    </div>
  );
}
