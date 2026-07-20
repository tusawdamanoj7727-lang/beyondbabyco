"use client";

import { useState } from "react";
import Image from "next/image";

import CategoryProductPlaceholder from "@/components/catalog/CategoryProductPlaceholder";
import StaticSvgImage, { isStaticSvgUrl } from "@/components/media/StaticSvgImage";
import {
  categoryPlaceholderImage,
  resolveProductVisualGroup,
} from "@/lib/catalog/product-category-images";
import {
  IMAGE_DIMENSIONS,
  IMAGE_QUALITY,
  IMAGE_SIZES,
  resolveImageBlur,
} from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

type ProductCardImageClientProps = {
  src: string;
  alt: string;
  productName: string;
  productSlug: string;
  categorySlug?: string | null;
  blurDataUrl?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  compact?: boolean;
  fallbackSrc: string;
};

/** Client-only image fallback — keeps the card shell server-rendered. */
export default function ProductCardImageClient({
  src,
  alt,
  productName,
  productSlug,
  categorySlug,
  blurDataUrl,
  className,
  imageClassName,
  sizes,
  quality = IMAGE_QUALITY.product,
  priority = false,
  compact = false,
  fallbackSrc,
}: ProductCardImageClientProps) {
  const [activeSrc, setActiveSrc] = useState(src);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  if (usePlaceholder) {
    return (
      <CategoryProductPlaceholder
        productName={productName}
        categorySlug={categorySlug}
        productSlug={productSlug}
        className={className}
        compact={compact}
      />
    );
  }

  if (isStaticSvgUrl(activeSrc)) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-cream-50", className)}>
        <StaticSvgImage
          src={activeSrc}
          alt={alt}
          fill
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  const { width, height } = IMAGE_DIMENSIONS.productCard;

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-cream-50", className)}>
      <Image
        src={activeSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes ?? IMAGE_SIZES.productCard}
        quality={quality}
        placeholder="blur"
        blurDataURL={resolveImageBlur(blurDataUrl)}
        className={cn("h-full w-full", imageClassName)}
        onError={() => {
          if (activeSrc !== fallbackSrc) {
            setActiveSrc(fallbackSrc);
            return;
          }
          setUsePlaceholder(true);
        }}
      />
    </div>
  );
}
