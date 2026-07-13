"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import { focusRing, imageHoverZoom } from "@/lib/design/ui";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";
import type { StorefrontProductImage } from "@/lib/catalog/types";

export default function ProductGallery({
  images,
  productName,
}: {
  images: StorefrontProductImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const current = sorted[activeIndex];
  const isLcpSlide = activeIndex === 0;

  const goTo = useCallback(
    (delta: number) => {
      if (sorted.length <= 1) return;
      setActiveIndex((i) => (i + delta + sorted.length) % sorted.length);
    },
    [sorted.length],
  );

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const diff = touchStartX - endX;
    if (Math.abs(diff) > 48) goTo(diff > 0 ? 1 : -1);
    setTouchStartX(null);
  }

  return (
    <div className="pdp-gallery lg:sticky lg:top-32 lg:self-start">
      <div
        className="pdp-gallery-hero group"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <>
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt ?? productName}
              fill
              priority={isLcpSlide}
              fetchPriority={isLcpSlide ? "high" : undefined}
              loading={isLcpSlide ? undefined : "lazy"}
              sizes={IMAGE_SIZES.productDetail}
              quality={IMAGE_QUALITY.product}
              placeholder="blur"
              blurDataURL={resolveImageBlur(current.blurDataUrl)}
              className={cn(
                "cursor-zoom-in object-cover object-center",
                imageHoverZoom,
              )}
              onClick={() => setLightboxOpen(true)}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className={cn(
                "absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/92 text-green-800 shadow-[var(--shadow-soft)] backdrop-blur-sm opacity-0 transition-opacity duration-[var(--duration-button)] group-hover:opacity-100 group-focus-within:opacity-100",
                focusRing,
              )}
              aria-label="Zoom image"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </>
        ) : (
          <ProductImageFallback />
        )}

        {sorted.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Previous image"
              className={cn(
                "absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/92 p-2.5 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:grid",
                focusRing,
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Next image"
              className={cn(
                "absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/92 p-2.5 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:grid",
                focusRing,
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {sorted.length > 1 ? (
        <>
          <div
            className="pdp-gallery-thumb-rail"
            role="tablist"
            aria-label="Product images"
          >
            {sorted.map((img, index) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                data-active={activeIndex === index ? "true" : "false"}
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1} of ${sorted.length}`}
                className={cn("pdp-gallery-thumb", focusRing)}
              >
                <Image
                  src={img.url}
                  alt={`${productName} view ${index + 1}`}
                  fill
                  loading="lazy"
                  sizes="80px"
                  placeholder="blur"
                  blurDataURL={resolveImageBlur(img.blurDataUrl)}
                  className="object-cover object-center"
                />
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
            {sorted.map((img, index) => (
              <span
                key={`dot-${img.id}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-[var(--duration-button)]",
                  activeIndex === index ? "w-4 bg-green-600" : "w-1.5 bg-green-200",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[120] bg-green-950/82 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-4 z-[130] flex items-center justify-center outline-none sm:inset-8">
            <Dialog.Title className="sr-only">{productName} — enlarged view</Dialog.Title>
            <Dialog.Description className="sr-only">
              Enlarged product image. Use arrow keys or swipe to navigate between images.
            </Dialog.Description>
            {current ? (
              <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
                <Image
                  src={current.url}
                  alt={current.alt ?? productName}
                  fill
                  sizes="100vw"
                  className="object-contain object-center"
                  priority
                />
              </div>
            ) : null}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close zoom"
                className={cn(
                  "absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/92 text-green-900 shadow-[var(--shadow-soft)]",
                  focusRing,
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
