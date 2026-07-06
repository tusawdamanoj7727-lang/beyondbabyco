"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { MICROCOPY } from "@/lib/brand/copy";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { focusRing, wishlistButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type ProductWishlistToggleProps = {
  productId: string;
  className?: string;
  size?: "sm" | "md";
};

export default function ProductWishlistToggle({
  productId,
  className,
  size = "md",
}: ProductWishlistToggleProps) {
  const toast = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const [pending, startTransition] = useTransition();
  const wishlisted = isWishlisted(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggle(productId);
      if (!result.ok && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(wishlisted ? MICROCOPY.removedFromWishlist : MICROCOPY.savedToWishlist);
    });
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        wishlistButton(wishlisted),
        "shadow-sm backdrop-blur-sm",
        wishlisted && "motion-safe:animate-[pulseSoft_0.4s_ease-out_1]",
        focusRing,
        className,
      )}
    >
      <Heart className={cn(iconSize, "transition-transform", wishlisted && "scale-110 fill-current")} aria-hidden="true" />
    </button>
  );
}
