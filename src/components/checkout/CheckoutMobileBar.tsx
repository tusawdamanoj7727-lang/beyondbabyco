"use client";

import { Loader2 } from "lucide-react";

import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";

export default function CheckoutMobileBar({
  total,
  busy,
  paymentPhase,
  onReview,
}: {
  total: number;
  busy: boolean;
  paymentPhase: "idle" | "placing" | "opening_razorpay";
  onReview: () => void;
}) {
  return (
    <div className="checkout-mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden pt-3 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-green-700">Total payable</p>
          <p className="font-heading text-lg font-bold text-green-900">{formatInr(total)}</p>
        </div>
        <Button
          variant="primary"
          type="button"
          className="min-w-[8.5rem] max-[360px]:min-w-[7.5rem] shrink-0 sm:min-w-[10.5rem]"
          disabled={busy}
          onClick={onReview}
        >
          {paymentPhase === "opening_razorpay" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            "Review order"
          )}
        </Button>
      </div>
    </div>
  );
}
