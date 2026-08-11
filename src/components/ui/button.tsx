import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-teal text-bg font-semibold active:bg-teal/85",
  secondary:
    "bg-card border border-border-strong text-text active:bg-card-hover",
  ghost: "text-text-muted active:bg-card",
  danger: "bg-danger-soft text-danger active:bg-danger/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "h-12 px-5 text-sm",
  sm: "h-9 px-3.5 text-xs",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
