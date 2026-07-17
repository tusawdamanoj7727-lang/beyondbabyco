"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useTransition } from "react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import { cn } from "@/lib/utils";

type CartUpsellRailProps = {
  products: StorefrontProduct[];
  className?: string;
  /** Compact row for mini-cart / side summary */
  compact?: boolean;
};

export default function CartUpsellRail({
  products,
  className,
  compact = false,
}: CartUpsellRailProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const gap = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const cartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const suggestions = useMemo(() => {
    const available = products.filter(
      (p) =>
        p.inStock &&
        p.status === "active" &&
        p.effectivePrice > 0 &&
        !cartIds.has(p.id),
    );
    if (available.length === 0) return [];

    // Prefer products that close (or nearly close) the free-shipping gap.
    const scored = available
      .map((p) => {
        const closesGap = gap > 0 && p.effectivePrice >= gap;
        const overshoot = closesGap ? p.effectivePrice - gap : Number.POSITIVE_INFINITY;
        return { product: p, closesGap, overshoot, price: p.effectivePrice };
      })
      .sort((a, b) => {
        if (a.closesGap !== b.closesGap) return a.closesGap ? -1 : 1;
        if (a.closesGap && b.closesGap) return a.overshoot - b.overshoot;
        return a.price - b.price;
      });

    return scored.slice(0, compact ? 2 : 3).map((s) => s.product);
  }, [products, cartIds, gap, compact]);

  if (suggestions.length === 0) return null;

  function add(product: StorefrontProduct) {
    startTransition(() => {
      addItem(buildCartItemInput(product));
      toast.success(`${product.name} added`);
    });
  }

  return (
    <section
      aria-labelledby="cart-upsell-heading"
      className={cn(
        "rounded-[var(--radius-card)] border border-green-100 bg-white p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <h2 id="cart-upsell-heading" className="font-heading text-base font-bold text-green-900">
        {gap > 0 ? "Add one more for free delivery" : "Complete your routine"}
      </h2>
      {gap > 0 ? (
        <p className="mt-1 text-sm text-green-700">
          You’re {formatInr(gap)} away from free shipping.
        </p>
      ) : (
        <p className="mt-1 text-sm text-green-700">Parents often add these with their order.</p>
      )}

      <ul className={cn("mt-4 space-y-3", compact && "space-y-2")}>
        {suggestions.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-green-50 bg-cream-50/60 p-2"
          >
            <Link
              href={`/products/${product.slug}`}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-100"
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={IMAGE_DIMENSIONS.productCard.width}
                  height={IMAGE_DIMENSIONS.productCard.height}
                  sizes={IMAGE_SIZES.productCard}
                  quality={IMAGE_QUALITY.product}
                  className="h-full w-full object-contain p-1"
                />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${product.slug}`}
                className="line-clamp-1 text-sm font-semibold text-green-900 hover:underline"
              >
                {product.name}
              </Link>
              <p className="text-sm font-bold text-green-800">
                {formatInr(product.effectivePrice)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => add(product)}
              className="shrink-0"
            >
              Add
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
