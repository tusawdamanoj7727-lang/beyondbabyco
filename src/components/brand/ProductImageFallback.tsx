import Image from "next/image";

import { resolveProductVisual } from "@/lib/brand/generated-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

type ProductImageFallbackProps = {
  className?: string;
  compact?: boolean;
  productSlug?: string;
  categorySlug?: string | null;
};

export default function ProductImageFallback({
  className,
  compact = false,
  productSlug = "baby-wipes",
  categorySlug,
}: ProductImageFallbackProps) {
  const visual = resolveProductVisual({
    slug: productSlug,
    categorySlug,
    angle: "white-background",
  });

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-cream-50", className)}
      aria-hidden="true"
    >
      <Image
        src={visual.imageUrl}
        alt=""
        fill
        sizes={compact ? "80px" : "(max-width: 640px) 50vw, 25vw"}
        placeholder="blur"
        blurDataURL={resolveImageBlur(visual.imageBlurDataUrl)}
        className="object-cover"
      />
    </div>
  );
}
