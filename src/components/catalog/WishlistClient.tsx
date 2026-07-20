"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Share2, ShoppingBag, X } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import ProductCard from "@/components/catalog/ProductCard";
import { ProductGridSkeleton } from "@/components/catalog/ProductCardSkeleton";
import QuickViewModal from "@/components/catalog/QuickViewModal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { buildCartItemInput } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { cn } from "@/lib/utils";

async function fetchWishlistProductsByIds(ids: string[]): Promise<StorefrontProduct[]> {
  if (ids.length === 0) return [];
  const res = await fetch("/api/wishlist?products=1", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: StorefrontProduct[] };
  const products = Array.isArray(data.products) ? data.products : [];
  const wanted = new Set(ids);
  return products.filter((p) => wanted.has(p.id));
}

export default function WishlistClient({
  products: initialProducts,
  isLoggedIn: _isLoggedIn,
}: {
  products: StorefrontProduct[];
  isLoggedIn: boolean;
}) {
  const addStoreItem = useCartStore((s) => s.addItem);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { ids, hydrated, remove: removeWishlist, refresh } = useWishlist();
  const idsKey = useMemo(() => [...ids].sort().join(","), [ids]);
  const initialIdsKey = useMemo(() => initialProducts.map((p) => p.id).sort().join(","), [initialProducts]);
  const [products, setProducts] = useState<StorefrontProduct[]>(initialProducts);
  const [, setLoading] = useState(false);
  const [quickView, setQuickView] = useState<StorefrontProduct | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const idList = (idsKey || initialIdsKey).split(",").filter(Boolean);
      if (idList.length === 0) {
        if (!cancelled) {
          if (hydrated) setProducts([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);
      try {
        const loaded = await fetchWishlistProductsByIds(idList);
        if (!cancelled) {
          setProducts(loaded);
        }
      } catch {
        // Keep whatever is already rendered (SSR or prior load).
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [idsKey, initialIdsKey, hydrated]);

  useEffect(() => {
    function onMerged() {
      refresh();
    }
    window.addEventListener("bbc:wishlist-merged", onMerged);
    return () => window.removeEventListener("bbc:wishlist-merged", onMerged);
  }, [refresh]);

  // Skeleton only before the first cookie-backed sync when we have no SSR rows.
  if (!hydrated && products.length === 0 && !initialIdsKey) {
    return <ProductGridSkeleton count={4} />;
  }

  if (products.length === 0) {
    return (
      <CatalogEmptyState
        title={MICROCOPY.wishlist.emptyTitle}
        description={MICROCOPY.wishlist.emptyDescription}
        actionLabel={MICROCOPY.wishlist.shopCta}
        actionHref="/products"
        mascot="bella-bunny"
      />
    );
  }

  function remove(productId: string) {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    startTransition(async () => {
      const result = await removeWishlist(productId);
      if (!result.ok && result.error) {
        toast.error(result.error);
        refresh();
        return;
      }
      toast.info(MICROCOPY.removedFromWishlist);
    });
  }

  function moveToCart(product: StorefrontProduct) {
    addStoreItem(buildCartItemInput(product));
    cartUi?.openMiniCart();
    toast.success("Added to cart!");
  }

  async function shareProduct(product: StorefrontProduct) {
    const url = `${window.location.origin}/products/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Could not share product");
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="relative flex flex-col">
            <div className="relative">
              <ProductCard product={product} onQuickView={setQuickView} hideHoverActions hideWishlistButton />
              <button
                type="button"
                disabled={pending}
                aria-label={`Remove ${product.name} from wishlist`}
                onClick={() => remove(product.id)}
                className={cn(
                  "absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream-200 bg-white text-green-800 shadow-sm transition hover:bg-terra-50 hover:text-terra-600 md:bg-white/95 md:backdrop-blur-sm",
                  focusRing,
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 max-[430px]:grid-cols-1 sm:grid-cols-3">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                type="button"
                disabled={product.status !== "active" || !product.inStock}
                onClick={() => moveToCart(product)}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Cart</span>
              </Button>
              <button
                type="button"
                onClick={() => setQuickView(product)}
                aria-label={`Quick view ${product.name}`}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-cream-300 text-sm font-medium text-green-800 hover:bg-green-50"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                type="button"
                onClick={() => void shareProduct(product)}
                aria-label={`Share ${product.name}`}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-cream-300 text-sm font-medium text-green-800 hover:bg-green-50"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-green-700">
        <Link href="/products" className="font-semibold text-terra-600 hover:underline">
          Continue shopping
        </Link>
      </p>
      <QuickViewModal product={quickView} open={!!quickView} onOpenChange={(open) => !open && setQuickView(null)} />
    </>
  );
}
