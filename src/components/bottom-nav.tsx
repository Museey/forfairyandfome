"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Home, ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", label: "วันนี้", icon: Home },
  { href: "/jobs", label: "งานทั้งหมด", icon: ListChecks },
  { href: "/calendar", label: "ปฏิทิน", icon: CalendarDays },
  { href: "/documents", label: "เอกสาร", icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-2">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] transition-colors",
                  active ? "text-teal" : "text-text-faint",
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
