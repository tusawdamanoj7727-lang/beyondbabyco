"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import EmptyState from "@/components/reviews/EmptyState";
import type { GalleryMediaItem } from "@/lib/reviews/types";

type ReviewGalleryProps = {
  items: GalleryMediaItem[];
  layout?: "grid" | "carousel";
  showCaptions?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ReviewGallery({
  items,
  layout = "grid",
  showCaptions = true,
  className,
  emptyTitle = "No customer photos yet",
  emptyDescription = "When parents share photos and videos, they will appear here.",
}: ReviewGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i == null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i == null ? null : (i - 1 + items.length) % items.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, items.length, closeLightbox]);

  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} mascot="poppy-panda" />;
  }

  return (
    <div className={className}>
      {layout === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Customer review gallery">
          {items.map((item, index) => (
            <li key={item.id}>
              <GalleryTile item={item} onClick={() => openLightbox(index)} showCaption={showCaptions} />
            </li>
          ))}
        </ul>
      ) : (
        <Carousel items={items} onSelect={openLightbox} showCaptions={showCaptions} />
      )}

      {lightboxIndex != null ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-green-950/80 p-4 backdrop-blur-sm motion-safe:animate-[fadeIn_0.2s_ease-out]"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close gallery"
          >
            <X aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((i) => (i == null ? null : (i - 1 + items.length) % items.length))}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
            aria-label="Previous image"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((i) => (i == null ? null : (i + 1) % items.length))}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
            aria-label="Next image"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <div className="max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <LightboxContent item={items[lightboxIndex]} titleId={titleId} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GalleryTile({
  item,
  onClick,
  showCaption,
}: {
  item: GalleryMediaItem;
  onClick: () => void;
  showCaption: boolean;
}) {
  const thumb = item.thumbnailUrl ?? item.url;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
      aria-label={`View ${item.type} from ${item.customerName ?? "customer"}${item.caption ? `: ${item.caption}` : ""}`}
    >
      {item.type === "photo" ? (
        <Image src={thumb} alt="" fill className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" sizes="(max-width:640px) 50vw, 25vw" />
      ) : (
        <>
          <Image src={thumb} alt="" fill className="object-cover opacity-90" sizes="(max-width:640px) 50vw, 25vw" />
          <span className="absolute inset-0 flex items-center justify-center bg-green-900/30">
            <span className="rounded-full bg-white/90 p-3 text-green-900 shadow-lg">
              <Play className="h-6 w-6" aria-hidden="true" />
            </span>
          </span>
        </>
      )}
      {showCaption && item.caption ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-950/80 to-transparent px-2 pb-2 pt-8 text-left text-xs font-medium text-white">
          {item.caption}
        </span>
      ) : null}
    </button>
  );
}

function Carousel({
  items,
  onSelect,
  showCaptions,
}: {
  items: GalleryMediaItem[];
  onSelect: (index: number) => void;
  showCaptions: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth motion-reduce:scroll-auto"
        role="list"
        aria-label="Review gallery carousel"
      >
        {items.map((item, index) => (
          <div key={item.id} role="listitem" className="w-[min(72vw,240px)] shrink-0 snap-start">
            <GalleryTile item={item} onClick={() => onSelect(index)} showCaption={showCaptions} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => scrollBy(-1)} className="icon-btn" aria-label="Scroll gallery left">
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={() => scrollBy(1)} className="icon-btn" aria-label="Scroll gallery right">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function LightboxContent({ item, titleId }: { item: GalleryMediaItem; titleId: string }) {
  return (
    <figure>
      {item.type === "photo" ? (
        <div className="relative max-h-[70vh] w-[min(90vw,56rem)]">
          <Image
            src={item.url}
            alt={item.caption ?? `Photo by ${item.customerName ?? "customer"}`}
            width={1200}
            height={900}
            className="h-auto max-h-[70vh] w-full object-contain"
            priority
          />
        </div>
      ) : (
        <div className="flex w-[min(90vw,56rem)] flex-col items-center justify-center bg-green-950 px-8 py-16 text-center text-white">
          <Play className="h-12 w-12 text-terra-300" aria-hidden="true" />
          <p id={titleId} className="mt-4 font-heading text-lg font-bold">
            Video review placeholder
          </p>
          <p className="mt-2 max-w-md text-sm text-green-100/80">
            Customer video uploads will play here. This demo uses a static preview until backend support is available.
          </p>
        </div>
      )}
      <figcaption className="space-y-1 bg-white px-4 py-3 text-sm text-green-800">
        {item.caption ? <p className="font-medium">{item.caption}</p> : null}
        <p className="text-green-700/70">
          {item.customerName ? `Shared by ${item.customerName}` : null}
          {item.productName && item.productSlug ? (
            <>
              {item.customerName ? " · " : null}
              <Link href={`/products/${item.productSlug}`} className="font-semibold text-terra-600 hover:underline">
                {item.productName}
              </Link>
            </>
          ) : null}
        </p>
      </figcaption>
    </figure>
  );
}
