import { ProductCardLayout } from "@/components/catalog/ProductCardLayout";
import {
  ProductCardListingAction,
  ProductCardWishlistButton,
} from "@/components/catalog/ProductCardActions";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/** Server shell + tiny client islands — keeps homepage LCP HTML without full card hydration. */
export default function FeaturedProductCard({
  product,
  imagePriority = false,
  className,
}: {
  product: StorefrontProduct;
  imagePriority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("relative h-full", className)}>
      <ProductCardLayout
        product={product}
        priority={imagePriority}
        actions={<ProductCardListingAction product={product} />}
      />
      <ProductCardWishlistButton product={product} />
    </article>
  );
}
