"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Delete } from "lucide-react";
import { cn } from "@/lib/cn";

type LoginUser = {
  id: string;
  name: string;
  role: string;
  colorTag: string;
};

const PIN_LENGTH = 4;

export function LoginPinPad({ users }: { users: LoginUser[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(user: LoginUser, fullPin: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, pin: fullPin }),
      });
      if (!res.ok) {
        setError(true);
        setPin("");
        setLoading(false);
        return;
      }
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch {
      setError(true);
      setPin("");
      setLoading(false);
    }
  }

  function press(digit: string) {
    if (loading || pin.length >= PIN_LENGTH || !selected) return;
    setError(false);
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === PIN_LENGTH) {
      submit(selected, nextPin);
    }
  }

  function backspace() {
    if (loading) return;
    setError(false);
    setPin((p) => p.slice(0, -1));
  }

  if (!selected) {
    return (
      <div className="flex gap-8">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => {
              setSelected(user);
              setPin("");
              setError(false);
            }}
            className="flex flex-col items-center gap-3 rounded-3xl px-2 py-4 transition active:scale-95"
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-bg"
              style={{ backgroundColor: user.colorTag }}
            >
              {user.name.slice(0, 1)}
            </span>
            <span className="text-sm text-text-muted">{user.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setPin("");
          setError(false);
        }}
        className="mb-6 flex flex-col items-center gap-2"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-bg"
          style={{ backgroundColor: selected.colorTag }}
        >
          {selected.name.slice(0, 1)}
        </span>
        <span className="text-sm text-text-muted">{selected.name}</span>
      </button>

      <div
        className={cn(
          "mb-8 flex gap-4",
          error && "animate-[shake_0.4s_ease-in-out]",
        )}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded-full border transition-colors",
              i < pin.length
                ? error
                  ? "border-danger bg-danger"
                  : "border-teal bg-teal"
                : "border-border-strong bg-transparent",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-danger">รหัส PIN ไม่ถูกต้อง ลองอีกครั้ง</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={loading}
            onClick={() => press(d)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-xl font-medium transition active:scale-95 active:bg-card-hover disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={loading}
          onClick={() => press("0")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-xl font-medium transition active:scale-95 active:bg-card-hover disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={backspace}
          className="flex h-16 w-16 items-center justify-center rounded-full text-text-muted transition active:scale-95 disabled:opacity-40"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
