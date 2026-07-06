import ProductCard from "@/components/catalog/ProductCard";
import { homepageGridGap } from "@/lib/design/ui";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export default function FeaturedCollections({ products }: { products: StorefrontProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="featured-collections-heading" className="mb-12">
      <div className="mb-6">
        <p className="collection-section-eyebrow">Curated for you</p>
        <h2 id="featured-collections-heading" className="collection-section-heading mt-2">
          Featured Collection
        </h2>
      </div>
      <div className={cn("homepage-section-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4", homepageGridGap)}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            className="homepage-product-card"
            hideHoverActions
            imagePriority={index < 2}
          />
        ))}
      </div>
    </section>
  );
}
