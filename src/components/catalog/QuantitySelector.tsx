"use client";

import { Minus, Plus } from "lucide-react";

import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
};

export default function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = "md",
  label = "Quantity",
}: QuantitySelectorProps) {
  const btnClass = cn(
    "inline-flex items-center justify-center rounded-xl border border-green-200 bg-white text-green-800 transition-colors",
    "hover:bg-green-50 focus-visible:outline-none",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-9 w-9 min-h-[44px] min-w-[44px]" : "h-11 w-11",
  );

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btnClass}
      >
        <Minus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <span
        className={cn(
          "min-w-[2rem] text-center font-semibold tabular-nums text-green-900",
          size === "sm" ? "text-sm" : "text-base",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btnClass}
      >
        <Plus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </div>
  );
}
