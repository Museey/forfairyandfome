"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export function TopBar({
  name,
  colorTag,
  title,
}: {
  name: string;
  colorTag: string;
  title?: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="pt-safe flex items-center justify-between px-5 pb-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} colorTag={colorTag} size={36} />
        <div>
          <p className="text-xs text-text-faint">สวัสดี</p>
          <p className="-mt-0.5 text-sm font-medium">{title ?? name}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          aria-label="ตั้งค่า"
          className="rounded-full p-2 text-text-faint transition active:scale-95"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          aria-label="ออกจากระบบ"
          className="rounded-full p-2 text-text-faint transition active:scale-95 active:text-danger disabled:opacity-40"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
