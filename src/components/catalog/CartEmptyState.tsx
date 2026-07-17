"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import Button from "@/components/ui/Button";
import { Mascot } from "@/components/mascots";
import { useToast } from "@/components/ui/ToastProvider";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { ctaHeight } from "@/lib/design/ui";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { cn } from "@/lib/utils";

const BELLA_CART_IMAGE = "/mascots/bella/bella-01-default.webp";

type CartEmptyStateProps = {
  className?: string;
  recoveryProducts?: StorefrontProduct[];
};

export default function CartEmptyState({ className, recoveryProducts = [] }: CartEmptyStateProps) {
  const [useFallback, setUseFallback] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const picks = recoveryProducts
    .filter((p) => p.inStock && p.status === "active" && p.effectivePrice > 0)
    .slice(0, 4);

  function add(product: StorefrontProduct) {
    startTransition(() => {
      addItem(buildCartItemInput(product));
      cartUi?.openMiniCart();
      toast.success(`${product.name} added`);
    });
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center",
        className,
      )}
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        {useFallback ? (
          <Mascot mascot="bella-bunny" pose="default" size={160} animated floating alt="" />
        ) : (
          <Image
            src={BELLA_CART_IMAGE}
            alt="Bella Bunny"
            width={160}
            height={160}
            sizes="160px"
            className="object-contain"
            priority
            onError={() => setUseFallback(true)}
          />
        )}
      </div>

      <h2 className="mt-6 font-heading text-[clamp(1.375rem,2.5vw,1.75rem)] font-bold text-green-900">
        Your cart is empty
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-[1.75] text-green-800">
        When you find something gentle for your little one, it will appear here.
      </p>

      <Button asChild variant="primary" className={cn(ctaHeight, "mt-8 min-w-[200px] font-semibold")}>
        <Link href="/products">Explore Products</Link>
      </Button>

      {picks.length > 0 ? (
        <div className="mt-12 w-full text-left">
          <h3 className="font-heading text-lg font-bold text-green-900">Start with these favourites</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {picks.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-green-100 bg-white p-3 shadow-[var(--shadow-soft)]"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-100"
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
                    className="line-clamp-2 text-sm font-semibold text-green-900 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-0.5 text-sm font-bold text-green-800">
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
        </div>
      ) : null}
    </div>
  );
}
