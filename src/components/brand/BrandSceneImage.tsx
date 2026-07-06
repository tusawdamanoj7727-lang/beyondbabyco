import Image from "next/image";

import { resolveVisualUrl, SCENE_FALLBACKS, sceneFallbackUrl, shouldUseGeneratedAsset } from "@/lib/brand/generated-assets";
import {
  EDITORIAL_IMAGE_QUALITY,
  IMAGE_QUALITY,
  IMAGE_SIZES,
  resolveImageBlur,
} from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

export type BrandSceneVariant = "lifestyle" | "science" | "product" | "forest";

const VARIANT_SIZES: Record<BrandSceneVariant, string> = {
  lifestyle: IMAGE_SIZES.lifestyleHero,
  science: IMAGE_SIZES.lifestyleHero,
  forest: IMAGE_SIZES.lifestyleHero,
  product: IMAGE_SIZES.productCard,
};

type BrandSceneImageProps = {
  variant?: BrandSceneVariant;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  blurDataURL?: string | null;
};

export default function BrandSceneImage({
  variant = "product",
  imageUrl,
  alt,
  className,
  imageClassName,
  priority = false,
  sizes,
  quality = variant === "product" ? IMAGE_QUALITY.product : EDITORIAL_IMAGE_QUALITY,
  blurDataURL,
}: BrandSceneImageProps) {
  const fallbackRef = SCENE_FALLBACKS[variant] ?? SCENE_FALLBACKS.lifestyle;
  const fallback = sceneFallbackUrl(variant);
  const useGenerated = shouldUseGeneratedAsset(imageUrl);
  const visual = useGenerated ? resolveVisualUrl(imageUrl, fallbackRef) : { url: imageUrl!.trim(), blur: fallback.blur };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-cream-50", className)}>
      <Image
        src={visual.url}
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? undefined : "lazy"}
        sizes={sizes ?? VARIANT_SIZES[variant]}
        quality={quality}
        placeholder="blur"
        blurDataURL={resolveImageBlur(blurDataURL ?? visual.blur)}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
