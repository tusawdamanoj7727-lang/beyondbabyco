import CategoryProductPlaceholder from "@/components/catalog/CategoryProductPlaceholder";
import ProductCardImage from "@/components/catalog/ProductCardImage";

type ProductImageFallbackProps = {
  className?: string;
  compact?: boolean;
  productSlug?: string;
  categorySlug?: string | null;
  productName?: string;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
};

export default function ProductImageFallback({
  className,
  compact = false,
  productSlug = "baby-wipes",
  categorySlug,
  productName,
  imageUrl,
  blurDataUrl,
}: ProductImageFallbackProps) {
  if (imageUrl || productName) {
    return (
      <ProductCardImage
        src={imageUrl}
        alt={productName ?? "Product"}
        productName={productName ?? "BeyondBabyCo"}
        productSlug={productSlug}
        categorySlug={categorySlug}
        blurDataUrl={blurDataUrl}
        compact={compact}
        className={className}
        sizes={compact ? "80px" : "(max-width: 640px) 50vw, 25vw"}
      />
    );
  }

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
