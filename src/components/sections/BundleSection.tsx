"use client";

import { useTransition } from "react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";

type Bundle = {
  id: string;
  label: string;
  title: string;
  description: string;
  slugs: string[];
};

const BUNDLES: Bundle[] = [
  {
    id: "bath",
    label: "Bath Time Bundle",
    title: "Daily Bath Routine",
    description: "Baby Body Wash + Baby Shampoo + Baby Lotion",
    slugs: ["baby-body-wash-200ml", "baby-shampoo-200ml", "baby-lotion-200ml"],
  },
  {
    id: "care",
    label: "Care Bundle",
    title: "Complete Baby Care",
    description: "Massage Oil + Hair Oil + Tummy Roll-On",
    slugs: ["baby-massage-oil-100ml", "baby-hair-oil-100ml", "tummy-rollon-40ml"],
  },
];

type BundleSectionProps = {
  products: StorefrontProduct[];
};

export default function BundleSection({ products }: BundleSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  function addBundle(bundle: Bundle, items: StorefrontProduct[]) {
    startTransition(() => {
      for (const product of items) {
        addItem(buildCartItemInput(product));
      }
      cartUi?.openMiniCart();
      toast.success(`${bundle.title} added to cart!`);
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {BUNDLES.map((bundle) => {
        const items = bundle.slugs
          .map((slug) => bySlug.get(slug))
          .filter((p): p is StorefrontProduct => !!p && p.inStock && p.effectivePrice > 0);
        const complete = items.length === bundle.slugs.length;
        const liveTotal = items.reduce((sum, p) => sum + p.effectivePrice, 0);

        return (
          <div
            key={bundle.id}
            className="rounded-2xl border border-green-100 bg-cream-50 p-6"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-terra-600">
              {bundle.label}
            </span>
            <h3 className="mb-2 mt-1 font-heading text-xl font-bold text-green-900">
              {bundle.title}
            </h3>
            <p className="mb-4 text-sm text-green-700">{bundle.description}</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                {complete ? (
                  <>
                    <span className="text-2xl font-black text-green-900">
                      {formatInr(liveTotal)}
                    </span>
                    <span className="ml-2 text-xs font-medium text-green-700">
                      as a set · individual prices
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-green-700">
                    Some items unavailable
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={pending || !complete}
                loading={pending}
                onClick={() => addBundle(bundle, items)}
                className="shrink-0"
              >
                Add Bundle
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
