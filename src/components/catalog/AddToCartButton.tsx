"use client";

import { ShoppingBag } from "lucide-react";
import { useTransition } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { focusRing, motionButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  product: StorefrontProduct;
  className?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  showIcon?: boolean;
  label?: string;
  onAction?: () => void;
};

export default function AddToCartButton({
  product,
  className,
  size = "md",
  fullWidth = true,
  showIcon = true,
  label = "Add to Cart",
  onAction,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (!canPurchaseProduct(product)) return null;

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => {
          addItem(buildCartItemInput(product));
          cartUi?.openMiniCart();
          toast.success("Added to cart!");
          onAction?.();
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full btn-primary-premium font-semibold text-white disabled:cursor-wait disabled:opacity-80",
        size === "sm" ? "h-11 px-4 text-sm" : "h-11 px-5 text-sm",
        fullWidth && "w-full",
        motionButton,
        focusRing,
        className,
      )}
    >
      {showIcon ? <ShoppingBag className="h-4 w-4" aria-hidden="true" /> : null}
      {pending ? "Adding…" : label}
    </button>
  );
}
