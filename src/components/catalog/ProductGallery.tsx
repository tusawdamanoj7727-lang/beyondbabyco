"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const thumbRailRef = useRef<HTMLDivElement>(null);

  const current = sorted[activeIndex];
  const isLcpSlide = activeIndex === 0;
  const multi = sorted.length > 1;

  const goTo = useCallback(
    (delta: number) => {
      if (sorted.length <= 1) return;
      setActiveIndex((i) => (i + delta + sorted.length) % sorted.length);
    },
    [sorted.length],
  );

  const setIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const rail = thumbRailRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>(`[data-thumb-index="${activeIndex}"]`);
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!lightboxOpen || !multi) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, multi, goTo]);

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
            <button
              type="button"
              className="absolute inset-0 z-[1] cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Zoom ${current.alt ?? productName}`}
            >
              <span className="sr-only">Open enlarged image</span>
            </button>
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
              className={cn("object-cover object-center", imageHoverZoom)}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className={cn(
                "absolute right-4 top-4 z-[2] grid h-11 w-11 place-items-center rounded-full bg-white/92 text-green-800 shadow-[var(--shadow-soft)] backdrop-blur-sm opacity-100 transition-opacity duration-[var(--duration-button)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                focusRing,
              )}
              aria-label="Zoom image"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            {multi ? (
              <p className="absolute bottom-3 left-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-green-900 shadow-[var(--shadow-soft)]">
                {activeIndex + 1} / {sorted.length}
              </p>
            ) : null}
          </>
        ) : (
          <ProductImageFallback />
        )}

        {multi ? (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Previous image"
              className={cn(
                "absolute left-3 top-1/2 z-[2] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 shadow-[var(--shadow-soft)] backdrop-blur-sm",
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
                "absolute right-3 top-1/2 z-[2] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 shadow-[var(--shadow-soft)] backdrop-blur-sm",
                focusRing,
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {multi ? (
        <>
          <div
            ref={thumbRailRef}
            className="pdp-gallery-thumb-rail"
            role="tablist"
            aria-label="Product images"
          >
            {sorted.map((img, index) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                data-thumb-index={index}
                aria-selected={activeIndex === index}
                data-active={activeIndex === index ? "true" : "false"}
                onClick={() => setIndex(index)}
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
          <div className="flex justify-center gap-1.5 sm:hidden" role="group" aria-label="Image position">
            {sorted.map((img, index) => (
              <button
                key={`dot-${img.id}`}
                type="button"
                onClick={() => setIndex(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-[var(--duration-button)]",
                  focusRing,
                  activeIndex === index ? "w-4 bg-green-600" : "w-2 bg-green-200",
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
              Enlarged product image. Use arrow keys or buttons to navigate between images. Press Escape to close.
            </Dialog.Description>
            {current ? (
              <div
                className="relative h-full max-h-[85vh] w-full max-w-4xl"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
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
            {multi ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(-1)}
                  aria-label="Previous image"
                  className={cn(
                    "absolute left-3 top-1/2 z-[140] grid -translate-y-1/2 rounded-full bg-white/92 p-3 text-green-900 shadow-[var(--shadow-soft)] sm:left-6",
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
                    "absolute right-3 top-1/2 z-[140] grid -translate-y-1/2 rounded-full bg-white/92 p-3 text-green-900 shadow-[var(--shadow-soft)] sm:right-6",
                    focusRing,
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <p className="absolute bottom-4 left-1/2 z-[140] -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-900">
                  {activeIndex + 1} / {sorted.length}
                </p>
              </>
            ) : null}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close zoom"
                className={cn(
                  "absolute right-4 top-4 z-[140] grid h-11 w-11 place-items-center rounded-full bg-white/92 text-green-900 shadow-[var(--shadow-soft)]",
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
