"use client";

import { useTransition } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { cn } from "@/lib/utils";

type Bundle = {
  id: string;
  label: string;
  title: string;
  description: string;
  price: number;
  compareAt: number;
  slugs: string[];
};

const BUNDLES: Bundle[] = [
  {
    id: "bath",
    label: "Bath Time Bundle",
    title: "Daily Bath Routine",
    description: "Baby Body Wash + Baby Shampoo + Baby Lotion",
    price: 799,
    compareAt: 999,
    slugs: ["baby-body-wash-200ml", "baby-shampoo-200ml", "baby-lotion-200ml"],
  },
  {
    id: "care",
    label: "Care Bundle",
    title: "Complete Baby Care",
    description: "Massage Oil + Hair Oil + Tummy Roll-On",
    price: 899,
    compareAt: 1147,
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

  function addBundle(bundle: Bundle) {
    startTransition(() => {
      const items = bundle.slugs.map((slug) => bySlug.get(slug)).filter(Boolean) as StorefrontProduct[];
      if (items.length !== bundle.slugs.length) {
        toast.error("Some bundle items are unavailable right now.");
        return;
      }
      for (const product of items) {
        addItem(buildCartItemInput(product));
      }
      cartUi?.openMiniCart();
      toast.success(`${bundle.title} added to cart!`);
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {BUNDLES.map((bundle) => (
        <div
          key={bundle.id}
          className="rounded-2xl border border-gray-100 bg-brand-cream p-6"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-brand-terra">
            {bundle.label}
          </span>
          <h3 className="mb-2 mt-1 text-xl font-bold text-brand-forest">{bundle.title}</h3>
          <p className="mb-4 text-sm text-gray-500">{bundle.description}</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-2xl font-black text-brand-forest">₹{bundle.price}</span>
              <span className="ml-2 text-sm text-gray-600 line-through">₹{bundle.compareAt}</span>
              <span className="ml-2 text-xs font-medium text-green-600">
                Save ₹{bundle.compareAt - bundle.price}
              </span>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => addBundle(bundle)}
              className={cn(
                "shrink-0 rounded-xl bg-brand-forest px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-60",
              )}
            >
              Add Bundle
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
