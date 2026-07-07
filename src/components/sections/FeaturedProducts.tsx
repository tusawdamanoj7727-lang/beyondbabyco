import Link from "next/link";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import NotifyMeButton from "@/components/homepage/NotifyMeButton";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import BrandSceneImage from "@/components/brand/BrandSceneImage";
import { FEATURED_PRODUCTS as FEATURED_COPY } from "@/lib/brand/copy";
import { FEATURED_PRODUCTS } from "../../lib/data";
import type { StorefrontFeaturedProduct } from "@/lib/homepage/storefront";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { ctaHeight, editorialImageCrop, focusRing, homepageGridGap, imageHoverZoom, motionButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  "Available now": "success",
  "Available Now": "success",
  "Best Seller": "success",
  Featured: "success",
  New: "info",
  "Coming 2026": "comingSoon",
  "Coming Soon": "comingSoon",
};

const LAUNCH_PRODUCT_COUNT = 7;

export default function FeaturedProducts({
  heading,
  products,
}: {
  heading?: string;
  products?: StorefrontFeaturedProduct[];
}) {
  const sectionHeading = heading?.trim() || FEATURED_COPY.heading;
  const items: StorefrontFeaturedProduct[] = (
    products?.length ? products : FEATURED_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      badge: p.badge,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      slug: "slug" in p ? p.slug : undefined,
    }))
  ).slice(0, LAUNCH_PRODUCT_COUNT);

  return (
    <HomeSection id="products" tone="white">
      <HomeSectionHeader
        eyebrow={FEATURED_COPY.eyebrow}
        heading={sectionHeading}
        intro={FEATURED_COPY.intro}
      />

      <div className={cn("homepage-section-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4", homepageGridGap)}>
        {items.map((product, index) => (
          <ScrollReveal key={product.id} delayMs={index * 50} className="h-full">
            <Card
              as="div"
              variant="elevated"
              radius="3xl"
              padding="none"
              hover
              fullHeight
              className="homepage-product-card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="product-pedestal-stage product-image-stage relative w-full overflow-hidden">
                <BrandSceneImage
                  variant="product"
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  priority={index < 2}
                  sizes={IMAGE_SIZES.productCard}
                  quality={IMAGE_QUALITY.product}
                  imageClassName={cn("product-pedestal-image", editorialImageCrop, imageHoverZoom)}
                />
                <div aria-hidden="true" className="product-pedestal-reflection" />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" size="sm" className="shrink-0">
                    {product.category}
                  </Badge>
                  <Badge
                    variant={STATUS_BADGE_VARIANT[product.badge] ?? "default"}
                    size="sm"
                    className="shrink-0"
                  >
                    {product.badge}
                  </Badge>
                </div>

                <h3 className="text-card-title mt-4">{product.name}</h3>

                <p className="prose-measure mt-2 line-clamp-3 text-sm leading-[1.75] text-green-700/85">
                  {product.description}
                </p>

                <p className="product-price">{product.price}</p>

                <div className="pt-4">
                  {product.slug ? (
                    <Link
                      href={`/products/${product.slug}`}
                      className={cn(
                        "btn-primary-premium inline-flex w-full items-center justify-center rounded-full px-5 text-base font-semibold",
                        ctaHeight,
                        motionButton,
                        focusRing,
                      )}
                    >
                      {FEATURED_COPY.viewProduct}
                    </Link>
                  ) : (
                    <NotifyMeButton
                      productCategory={product.category}
                      label={FEATURED_COPY.notifyMe}
                      className={cn(ctaHeight, "text-base")}
                    />
                  )}
                </div>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </HomeSection>
  );
}
