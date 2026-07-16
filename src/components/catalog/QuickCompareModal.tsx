"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import RatingStars from "@/components/reviews/RatingStars";
import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { ctaHeight, focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function QuickCompareModal({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: StorefrontProduct[];
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-green-950/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-[110] max-h-[90vh] w-auto max-w-4xl -translate-y-1/2 overflow-y-auto rounded-[var(--radius-card)] border border-white/80 bg-cream-50 p-6 shadow-[var(--shadow-premium)] outline-none sm:inset-x-auto sm:left-1/2 sm:w-[min(94vw,56rem)] sm:-translate-x-1/2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-heading text-xl font-bold text-green-900 sm:text-2xl">
                Quick compare
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-green-700">
                Side-by-side view of selected products — no checkout changes.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close compare"
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-green-800 shadow-[var(--shadow-soft)]",
                  focusRing,
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-green-700">Select up to two products to compare.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <CompareColumn key={product.id} product={product} />
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CompareColumn({ product }: { product: StorefrontProduct }) {
  const isComingSoon = product.status === "coming_soon";
  const canPurchase = product.status === "active" && product.inStock;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-[var(--shadow-soft)]">
      <div className="relative aspect-square bg-cream-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={IMAGE_DIMENSIONS.productCard.width}
            height={IMAGE_DIMENSIONS.productCard.height}
            className="h-full w-full object-cover object-center"
            sizes={IMAGE_SIZES.productCard}
            quality={IMAGE_QUALITY.product}
          />
        ) : (
          <ProductImageFallback productSlug={product.slug} categorySlug={product.categorySlug} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.categoryName ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-600/80">{product.categoryName}</p>
        ) : null}
        <h3 className="mt-2 font-heading text-lg font-bold text-green-900">{product.name}</h3>
        {product.shortDescription ? (
          <p className="mt-2 line-clamp-3 text-sm leading-[1.7] text-green-800">{product.shortDescription}</p>
        ) : null}
        {product.ratingCount > 0 ? (
          <div className="mt-3">
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} detailed />
          </div>
        ) : null}
        <dl className="mt-4 space-y-2 border-t border-green-50 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-green-700">Price</dt>
            <dd className="font-semibold text-green-900">
              {isComingSoon ? "Launching 2026" : formatInr(product.effectivePrice)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-green-700">Availability</dt>
            <dd className="font-semibold text-green-900">
              {isComingSoon ? "Coming soon" : canPurchase ? "In stock" : "Waitlist open"}
            </dd>
          </div>
          {product.ageGroupName ? (
            <div className="flex justify-between gap-3">
              <dt className="text-green-700">Age</dt>
              <dd className="font-semibold text-green-900">{product.ageGroupName}</dd>
            </div>
          ) : null}
        </dl>
        <Button asChild variant="primary" fullWidth className={cn(ctaHeight, "mt-5 text-base font-semibold")}>
          <Link href={`/products/${product.slug}`}>View product</Link>
        </Button>
      </div>
    </article>
  );
}
