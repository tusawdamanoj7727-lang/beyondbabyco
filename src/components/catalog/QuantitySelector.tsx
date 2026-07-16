"use client";

import { Minus, Plus } from "lucide-react";

import { CART_MAX_QUANTITY } from "@/lib/storefront/cart-types";
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
  /** Pill style used on product detail pages. */
  variant?: "rounded" | "pill";
  /** Show "Max 10 per order" when quantity hits the order cap. */
  showMaxHint?: boolean;
  maxHintText?: string;
};

export default function QuantitySelector({
  value,
  min = 1,
  max = CART_MAX_QUANTITY,
  onChange,
  disabled = false,
  size = "md",
  label = "Quantity",
  variant = "rounded",
  showMaxHint = false,
  maxHintText = "Max 10 per order",
}: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const showHint = showMaxHint && atMax && max >= CART_MAX_QUANTITY;

  const btnClass = cn(
    "inline-flex items-center justify-center text-green-800 transition-colors",
    "focus-visible:outline-none",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-40",
    variant === "pill"
      ? "h-11 w-11 min-h-[44px] min-w-[44px] hover:bg-cream-50 disabled:hover:bg-transparent"
      : cn(
          "h-11 w-11 flex items-center justify-center rounded-xl border border-green-200 bg-white hover:bg-green-50",
        ),
  );

  const control = (
    <div
      className={cn(
        variant === "pill" ? "pdp-qty-control" : "inline-flex items-center gap-2",
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btnClass}
      >
        <Minus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      </button>
      <span
        className={cn(
          "tabular-nums text-green-900",
          variant === "pill"
            ? "inline-flex min-w-[2.5rem] items-center justify-center px-2 font-bold"
            : cn("min-w-[2rem] text-center font-semibold", size === "sm" ? "text-sm" : "text-base"),
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btnClass}
      >
        <Plus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      </button>
    </div>
  );

  if (!showHint) return control;

  return (
    <div className="flex flex-col gap-1.5">
      {control}
      <p className="text-xs font-medium text-green-700">{maxHintText}</p>
    </div>
  );
}
