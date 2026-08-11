"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkIn, checkOut } from "@/app/(app)/attendance-actions";
import { formatTime } from "@/lib/date";

export function AttendanceStatus({
  canToggle,
  managerName,
  isCheckedIn,
  lastEventAt,
}: {
  canToggle: boolean;
  managerName: string;
  isCheckedIn: boolean;
  lastEventAt: Date | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const statusText = isCheckedIn
    ? `เช็คอินอยู่ · ตั้งแต่ ${formatTime(lastEventAt)}`
    : lastEventAt
      ? `เช็คเอาท์แล้ว · เมื่อ ${formatTime(lastEventAt)}`
      : "ยังไม่เช็คอินวันนี้";

  if (!canToggle) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3">
        <span
          className={
            isCheckedIn
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-hover text-text-faint"
          }
        >
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{managerName}</p>
          <p className="text-xs text-text-faint">{statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">สถานะเข้างานวันนี้</p>
        <p className="text-xs text-text-faint">{statusText}</p>
      </div>
      {isCheckedIn ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run(checkOut)}
        >
          <LogOut className="h-4 w-4" />
          เช็คเอาท์
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => run(checkIn)}>
          <LogIn className="h-4 w-4" />
          เช็คอิน
        </Button>
      )}
    </div>
  );
}
