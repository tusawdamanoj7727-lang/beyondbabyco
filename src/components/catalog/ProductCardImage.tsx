import CategoryProductPlaceholder from "@/components/catalog/CategoryProductPlaceholder";
import ProductCardImageClient from "@/components/catalog/ProductCardImageClient";
import {
  categoryPlaceholderImage,
  resolveProductVisualGroup,
} from "@/lib/catalog/product-category-images";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

type ProductCardImageProps = {
  src: string | null | undefined;
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
};

/** Server-rendered product image — hydrates only the tiny error-fallback client island. */
export default function ProductCardImage({
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
}: ProductCardImageProps) {
  const group = resolveProductVisualGroup(categorySlug, productSlug);
  const fallbackSrc = categoryPlaceholderImage(group);
  const trimmed = src?.trim();

  if (!trimmed) {
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

  return (
    <ProductCardImageClient
      src={trimmed}
      alt={alt}
      productName={productName}
      productSlug={productSlug}
      categorySlug={categorySlug}
      blurDataUrl={blurDataUrl}
      className={className}
      imageClassName={imageClassName}
      sizes={sizes ?? IMAGE_SIZES.productCard}
      quality={quality}
      priority={priority}
      compact={compact}
      fallbackSrc={fallbackSrc}
    />
  );
}
