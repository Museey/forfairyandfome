"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Without this, a failed Server Function takes the whole app down to the
// browser's own "page couldn't load" screen with no way back.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <div>
        <p className="text-base font-medium">มีบางอย่างผิดพลาด</p>
        <p className="mt-1 text-sm text-text-muted">
          ลองใหม่อีกครั้ง ถ้ายังไม่หายให้ปิดแอปแล้วเปิดใหม่
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          ลองใหม่
        </Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          โหลดหน้าใหม่
        </Button>
      </div>

      {error.digest && (
        <p className="text-xs text-text-faint">รหัสข้อผิดพลาด: {error.digest}</p>
      )}
    </div>
  );
}
