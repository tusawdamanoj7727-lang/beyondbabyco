"use client";

import { Loader2, Tag } from "lucide-react";

import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";
import { focusRing, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function CheckoutCouponBlock({
  couponId,
  appliedCode,
  appliedSavings,
  couponInput,
  couponMsg,
  applying,
  disabled,
  onInputChange,
  onApply,
  onRemove,
}: {
  couponId: string;
  appliedCode: string | null;
  appliedSavings: number;
  couponInput: string;
  couponMsg: { text: string; type: "" | "success" | "error" };
  applying: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-3xl border border-green-100/80 bg-white/95 p-4 shadow-sm sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-900">
        <Tag className="h-4 w-4 text-terra-600" aria-hidden="true" />
        Coupon
      </p>
      {appliedCode ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <span className="text-sm font-semibold text-green-800">
            {appliedCode}
            {appliedSavings > 0 ? ` — save ${formatInr(appliedSavings)}` : ""}
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={cn("text-xs font-medium text-green-700 hover:text-terra-600", focusRing)}
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <label htmlFor={couponId} className="sr-only">
              Coupon code
            </label>
            <input
              id={couponId}
              value={couponInput}
              onChange={(e) => onInputChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply();
                }
              }}
              placeholder="Enter code"
              disabled={applying || disabled}
              autoComplete="off"
              enterKeyHint="go"
              className={formControl}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={applying || disabled || !couponInput.trim()}
              onClick={onApply}
              className="shrink-0 px-4"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Apply"}
            </Button>
          </div>
          {couponMsg.text ? (
            <p
              className={cn(
                "mt-1.5 text-xs",
                couponMsg.type === "success" ? "text-green-600" : "text-terra-700",
              )}
              role="status"
            >
              {couponMsg.text}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-green-700">
              Have a code? Apply it here before placing your order.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
