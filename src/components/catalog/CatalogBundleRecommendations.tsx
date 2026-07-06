import Image from "next/image";
import Link from "next/link";

import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";

export default function CatalogBundleRecommendations({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const bundleItems = products.slice(0, 3);
  if (bundleItems.length < 2) return null;

  return (
    <section aria-labelledby="bundle-recommendations-heading" className="mb-12">
      <div className="collection-bundle-panel">
        <p className="collection-section-eyebrow">Complete your routine</p>
        <h2 id="bundle-recommendations-heading" className="collection-section-heading mt-2">
          Bundle recommendations
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-[1.75] text-green-700/88">
          Pair gentle essentials that work together — curated from our research-backed collection.
        </p>

        <div className="collection-bundle-grid">
          {bundleItems.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="collection-bundle-item group"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-50">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    loading="lazy"
                    sizes={IMAGE_SIZES.productCard}
                    quality={IMAGE_QUALITY.product}
                    className="object-cover object-center transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-heading text-sm font-bold text-green-900">{product.name}</p>
                <p className="mt-1 text-sm font-semibold text-green-800">
                  {product.status === "coming_soon" ? "Launching 2026" : formatInr(product.effectivePrice)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-terra-600">
          Pair essentials from our daily care range — gentle formulas designed to work together
        </p>
      </div>
    </section>
  );
}
