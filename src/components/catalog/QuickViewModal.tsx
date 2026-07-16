"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import ProductImageFallback from "@/components/brand/ProductImageFallback";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function QuickViewModal({
  product,
  open,
  onOpenChange,
}: {
  product: StorefrontProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  const isComingSoon = product.status === "coming_soon";
  const canPurchase = canPurchaseProduct(product);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-green-900/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[110] w-[min(94vw,56rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-4xl border border-white/80 bg-cream-50 shadow-clay outline-none",
          )}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close quick view"
              className={cn(
                "absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-green-800 shadow-sm",
                focusRing,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
          <Dialog.Title className="sr-only">Quick view: {product.name}</Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square bg-cream-100 md:aspect-auto md:min-h-[420px]">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes={IMAGE_SIZES.productCard}
                  quality={IMAGE_QUALITY.product}
                  placeholder="blur"
                  blurDataURL={resolveImageBlur(product.imageBlurDataUrl)}
                  className="object-cover"
                />
              ) : (
                <ProductImageFallback />
              )}
            </div>
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex flex-wrap gap-2">
                {product.badge ? (
                  <Badge variant={isComingSoon ? "comingSoon" : "success"} size="sm">
                    {product.badge}
                  </Badge>
                ) : null}
                {product.secondaryBadge ? (
                  <Badge variant="info" size="sm">
                    {product.secondaryBadge}
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-3 font-heading text-2xl font-bold text-green-900">{product.name}</h2>
              {product.shortDescription ? (
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-green-800">{product.shortDescription}</p>
              ) : null}
              <p className="mt-4 font-heading text-2xl font-extrabold text-green-900">
                {isComingSoon ? "Launching 2026" : formatInr(product.effectivePrice)}
              </p>
              <div className="mt-auto flex flex-col gap-3 pt-6">
                {canPurchase ? (
                  <AddToCartButton
                    product={product}
                    onAction={() => onOpenChange(false)}
                  />
                ) : (
                  <NotifyMeButton
                    product={product}
                    onAction={() => onOpenChange(false)}
                  />
                )}
                <Button
                  asChild
                  variant={canPurchase ? "secondary" : "ghost"}
                  fullWidth
                >
                  <Link href={`/products/${product.slug}`} onClick={() => onOpenChange(false)}>
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
