"use client";

import { Bell } from "lucide-react";

import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { buildProductNotifyTarget, notifyMeButtonLabel } from "@/lib/notify-me/target";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type NotifyMeButtonProps = {
  product: Pick<StorefrontProduct, "id" | "name" | "categoryName" | "status">;
  productId?: string;
  productName?: string;
  className?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  label?: string;
  onAction?: () => void;
};

/** Opens the email modal and saves to Supabase waitlist / waitlist_emails. */
export default function NotifyMeButton({
  product,
  productId,
  productName,
  className,
  size = "md",
  fullWidth = true,
  label,
  onAction,
}: NotifyMeButtonProps) {
  const { openNotifyMe } = useNotifyMe();
  const target = buildProductNotifyTarget(product);
  const displayLabel = label ?? notifyMeButtonLabel(target.mode, product.status);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openNotifyMe({
          ...target,
          productId: productId ?? product.id,
          productName: productName ?? product.name,
        });
        onAction?.();
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-green-300 bg-white font-semibold text-green-800 transition hover:bg-green-50",
        size === "sm" ? "h-11 px-4 text-sm" : "h-11 px-5 text-sm",
        fullWidth && "w-full",
        focusRing,
        className,
      )}
    >
      <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
      {displayLabel}
    </button>
  );
}
