import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import FeaturedProductCard from "@/components/catalog/FeaturedProductCard";
import { FEATURED_PRODUCTS as FEATURED_COPY } from "@/lib/brand/copy";
import type { StorefrontFeaturedProduct } from "@/lib/homepage/storefront";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { GST_RATE_BABY } from "@/lib/catalog/gst-rates";
import { cn } from "@/lib/utils";

const LAUNCH_PRODUCT_COUNT = 8;

function featuredToStorefront(product: StorefrontFeaturedProduct): StorefrontProduct | null {
  if (!product.slug) return null;
  const priceNum = Number(String(product.price).replace(/[^\d.]/g, "")) || 0;
  const comingSoon = /coming/i.test(product.badge);
  const inStock = /stock|available|best|new|featured/i.test(product.badge) && !comingSoon;
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    shortDescription: product.description || null,
    price: priceNum,
    compareAtPrice: null,
    salePrice: null,
    effectivePrice: priceNum,
    discountPercent: null,
    status: comingSoon ? "coming_soon" : "active",
    stock: inStock ? 10 : 0,
    inStock,
    ratingAvg: product.ratingAvg ?? 0,
    ratingCount: product.ratingCount ?? 0,
    categoryId: null,
    categoryName: product.category,
    categorySlug: null,
    ageGroupName: null,
    ageGroupSlug: null,
    subcategoryId: null,
    subcategoryName: null,
    brandId: null,
    brandName: null,
    brandSlug: null,
    imageUrl: product.imageUrl ?? null,
    isFeatured: true,
    isBestSeller: /best/i.test(product.badge),
    isNewArrival: /new/i.test(product.badge),
    isTrending: false,
    badge: product.badge,
    gstRate: GST_RATE_BABY,
  };
}

export default function FeaturedProducts({
  heading,
  products,
}: {
  heading?: string;
  products?: StorefrontFeaturedProduct[];
}) {
  const sectionHeading = heading?.trim() || FEATURED_COPY.heading;
  const cards = (products ?? [])
    .map(featuredToStorefront)
    .filter((p): p is StorefrontProduct => p != null)
    .slice(0, LAUNCH_PRODUCT_COUNT);

  if (cards.length === 0) return null;

  return (
    <HomeSection id="products" tone="white" reveal={false} className="homepage-featured-section">
      <HomeSectionHeader
        eyebrow={FEATURED_COPY.eyebrow}
        heading={sectionHeading}
        intro={FEATURED_COPY.intro}
        className="homepage-featured-header"
      />

      <div
        className={cn(
          "homepage-section-grid homepage-featured-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          "gap-4 sm:gap-6 lg:gap-8",
        )}
      >
        {cards.map((product) => (
          <FeaturedProductCard
            key={product.id}
            product={product}
            imagePriority={false}
            className="homepage-product-card h-full"
          />
        ))}
      </div>
    </HomeSection>
  );
}
