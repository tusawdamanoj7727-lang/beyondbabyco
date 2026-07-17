"use client";

import { formatInr } from "@/lib/catalog/format";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  freeShippingProgress,
} from "@/lib/storefront/shipping";
import { cn } from "@/lib/utils";

type FreeShippingProgressProps = {
  subtotal: number;
  className?: string;
  /** Compact single-line banner for cart header area. */
  variant?: "default" | "banner";
  /** Force unlocked state (e.g. free-shipping coupon). */
  unlocked?: boolean;
};

export default function FreeShippingProgress({
  subtotal,
  className,
  variant = "default",
  unlocked,
}: FreeShippingProgressProps) {
  const { amountToFreeShipping, progressPercent, hasFreeShipping } = freeShippingProgress(subtotal);
  const isUnlocked = unlocked ?? hasFreeShipping;

  const message = isUnlocked ? (
    <p className="text-sm font-semibold text-green-700">You got FREE delivery!</p>
  ) : (
    <p className="text-sm font-medium text-green-800">
      Add {formatInr(amountToFreeShipping)} more for FREE delivery!
    </p>
  );

  const progressBar = (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      role="progressbar"
      aria-valuenow={isUnlocked ? 100 : progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={
        isUnlocked
          ? "Free delivery unlocked"
          : `${Math.round(progressPercent)}% toward free delivery on orders over ${formatInr(FREE_SHIPPING_THRESHOLD)}`
      }
    >
      <div
        className="h-2 rounded-full bg-green-600 transition-all duration-500 ease-out"
        style={{ width: `${isUnlocked ? 100 : progressPercent}%` }}
      />
    </div>
  );

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3",
          className,
        )}
      >
        <div className="space-y-2">
          {message}
          {progressBar}
          {!isUnlocked ? (
            <p className="text-xs text-green-700">
              Standard delivery {formatInr(STANDARD_SHIPPING_FEE)} · Free on {formatInr(FREE_SHIPPING_THRESHOLD)}+
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {message}
      {progressBar}
    </div>
  );
}
