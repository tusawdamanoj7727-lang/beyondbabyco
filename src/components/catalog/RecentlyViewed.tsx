"use client";

import { useEffect, useState } from "react";

import ProductCard from "@/components/catalog/ProductCard";
import { homepageGridGap } from "@/lib/design/ui";
import { fetchRecentlyViewedProducts } from "@/lib/storefront/recently-viewed-actions";
import { readRecentlyViewedIds } from "@/lib/storefront/recently-viewed";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export default function RecentlyViewed({
  currentProductId,
  variant = "pdp",
}: {
  currentProductId?: string;
  variant?: "pdp" | "collection";
}) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);

  useEffect(() => {
    const ids = readRecentlyViewedIds(currentProductId);
    if (ids.length === 0) return;
    void fetchRecentlyViewedProducts(ids, currentProductId ?? "").then(setProducts);
  }, [currentProductId]);

  if (products.length === 0) return null;

  const isCollection = variant === "collection";

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className={cn(isCollection ? "mt-16 pb-8" : "mt-16")}
    >
      <p className={isCollection ? "collection-section-eyebrow" : undefined}>Pick up where you left off</p>
      <h2
        id="recently-viewed-heading"
        className={cn(
          isCollection ? "collection-section-heading mt-2" : "font-heading text-2xl font-bold text-green-900",
        )}
      >
        Recently Viewed
      </h2>
      <div
        className={cn(
          isCollection
            ? cn("homepage-section-grid mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", homepageGridGap)
            : "mt-6 flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 lg:gap-6",
        )}
      >
        {products.map((product) =>
          isCollection ? (
            <ProductCard
              key={product.id}
              product={product}
              hideHoverActions
              className="homepage-product-card"
            />
          ) : (
            <div key={product.id} className="w-[min(85vw,280px)] shrink-0 snap-start sm:w-auto">
              <ProductCard product={product} hideHoverActions />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
