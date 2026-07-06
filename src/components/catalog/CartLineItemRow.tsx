"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, Trash2 } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import QuantitySelector from "@/components/catalog/QuantitySelector";
import Badge from "@/components/ui/Badge";
import { formatInr } from "@/lib/catalog/format";
import { IMAGE_SIZES } from "@/lib/media/image-delivery";
import { cartLineKey, CART_MAX_QUANTITY, type CartItem } from "@/lib/storefront/cart-types";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { motionCard, surfaceCard } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type CartLineItemProps = {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
  compact?: boolean;
  /** Show save-for-later and wishlist actions (default true). */
  showExtras?: boolean;
};

export default function CartLineItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  compact = false,
  showExtras = true,
}: CartLineItemProps) {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(item.productId);
  const mrp = item.compareAtPrice ?? item.price;
  const savings = mrp > item.price ? (mrp - item.price) * item.quantity : 0;
  const discountPct =
    mrp > item.price ? Math.round(((mrp - item.price) / mrp) * 100) : null;
  const lowStock = item.inStock && item.stock > 0 && item.stock <= 5;

  return (
    <article
      className={cn(
        "group flex gap-4 p-4",
        surfaceCard,
        motionCard,
        compact && "p-3",
      )}
    >
      <Link
        href={`/products/${item.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-50 sm:h-24 sm:w-24"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes={IMAGE_SIZES.cartLineItem} />
        ) : (
          <ProductImageFallback compact />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              className="font-heading text-base font-semibold text-green-900 hover:text-green-700 sm:text-lg"
            >
              {item.name}
            </Link>
            {item.variantName ? (
              <p className="mt-0.5 text-sm text-green-700/70">{item.variantName}</p>
            ) : null}
          </div>
          {!compact ? (
            <p className="font-heading text-lg font-bold text-green-900">
              {formatInr(item.price * item.quantity)}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-heading font-bold text-green-800">{formatInr(item.price)}</span>
          {mrp > item.price ? (
            <>
              <span className="text-sm text-green-600/75 line-through">{formatInr(mrp)}</span>
              {discountPct ? (
                <span className="text-xs font-semibold text-terra-600">-{discountPct}%</span>
              ) : null}
            </>
          ) : null}
        </div>

        {savings > 0 && !compact ? (
          <p className="mt-1 text-xs font-medium text-terra-600">You save {formatInr(savings)}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!item.inStock ? (
            <Badge variant="comingSoon" size="sm">
              Out of stock
            </Badge>
          ) : lowStock ? (
            <Badge variant="warning" size="sm">
              Only {item.stock} left
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <QuantitySelector
            value={item.quantity}
            min={1}
            max={Math.min(item.stock || CART_MAX_QUANTITY, CART_MAX_QUANTITY)}
            onChange={onUpdateQuantity}
            disabled={!item.inStock}
            size={compact ? "sm" : "md"}
            showMaxHint
          />
          {showExtras && onSaveForLater ? (
            <>
              <button
                type="button"
                onClick={onSaveForLater}
                className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900"
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                Save for later
              </button>
              <button
                type="button"
                onClick={() => void toggle(item.productId)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium transition-colors",
                  wishlisted ? "text-terra-600" : "text-green-700 hover:text-green-900",
                )}
              >
                <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} aria-hidden="true" />
                Wishlist
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name} from cart`}
            className="inline-flex items-center gap-1 text-sm font-medium text-terra-600 hover:text-terra-700"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {!compact ? "Remove" : null}
          </button>
        </div>
      </div>
    </article>
  );
}

export { cartLineKey };
