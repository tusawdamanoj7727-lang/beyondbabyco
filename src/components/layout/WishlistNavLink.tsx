"use client";

import Link from "next/link";
import { memo } from "react";
import { Heart } from "lucide-react";

import { useWishlist } from "@/lib/storefront/wishlist-context";
import { focusRing, headerIconBtn } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const WishlistNavLink = memo(function WishlistNavLink({ onClick }: { onClick?: () => void }) {
  const { ids } = useWishlist();
  const count = ids.size;

  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} items` : "Wishlist"}
      onClick={onClick}
      className={cn(headerIconBtn, focusRing, "relative")}
    >
      <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
      {count > 0 ? (
        <span
          className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
});

export default WishlistNavLink;
