"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";

export default function CatalogBundleRecommendations({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const bundleItems = products
    .filter((p) => p.inStock && p.status === "active" && p.effectivePrice > 0)
    .slice(0, 3);
  const addItem = useCartStore((s) => s.addItem);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (bundleItems.length < 2) return null;

  const bundleTotal = bundleItems.reduce((sum, p) => sum + p.effectivePrice, 0);

  function addAll() {
    startTransition(() => {
      for (const product of bundleItems) {
        addItem(buildCartItemInput(product));
      }
      cartUi?.openMiniCart();
      toast.success("Bundle added to cart");
    });
  }

  return (
    <section aria-labelledby="bundle-recommendations-heading" className="mb-12">
      <div className="collection-bundle-panel">
        <p className="collection-section-eyebrow">Complete your routine</p>
        <h2 id="bundle-recommendations-heading" className="collection-section-heading mt-2">
          Bundle recommendations
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-[1.75] text-green-800">
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
                    width={IMAGE_DIMENSIONS.productCard.width}
                    height={IMAGE_DIMENSIONS.productCard.height}
                    loading="lazy"
                    sizes={IMAGE_SIZES.productCard}
                    quality={IMAGE_QUALITY.product}
                    className="h-full w-full object-cover object-center transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-heading text-sm font-bold text-green-900">{product.name}</p>
                <p className="mt-1 text-sm font-semibold text-green-800">
                  {formatInr(product.effectivePrice)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-green-800">
            Set total · {formatInr(bundleTotal)}
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            loading={pending}
            onClick={addAll}
          >
            {pending ? "Adding…" : "Add all to cart"}
          </Button>
        </div>
      </div>
    </section>
  );
}
