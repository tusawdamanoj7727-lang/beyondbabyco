"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Share2, ShoppingBag, Trash2 } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import ProductCard from "@/components/catalog/ProductCard";
import QuickViewModal from "@/components/catalog/QuickViewModal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { getPublicProductsByIds, removeFromWishlistAction } from "@/lib/storefront/wishlist-actions";
import { readGuestWishlistIds, writeGuestWishlistIds } from "@/lib/storefront/wishlist-storage";
import { useWishlist } from "@/lib/storefront/wishlist-context";

export default function WishlistClient({
  products: initialProducts,
  isLoggedIn,
}: {
  products: StorefrontProduct[];
  isLoggedIn: boolean;
}) {
  const cart = useCartOptional();
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { isGuest, refresh } = useWishlist();
  const [products, setProducts] = useState(initialProducts);
  const [quickView, setQuickView] = useState<StorefrontProduct | null>(null);
  const [pending, startTransition] = useTransition();

  const loadGuestProducts = useCallback(async () => {
    const ids = readGuestWishlistIds();
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    const loaded = await getPublicProductsByIds(ids);
    setProducts(loaded);
  }, []);

  useEffect(() => {
    if (isGuest) void loadGuestProducts();
    else setProducts(initialProducts);
  }, [isGuest, initialProducts, loadGuestProducts]);

  useEffect(() => {
    function onMerged() {
      refresh();
    }
    window.addEventListener("bbc:wishlist-merged", onMerged);
    return () => window.removeEventListener("bbc:wishlist-merged", onMerged);
  }, [refresh]);

  if (products.length === 0) {
    return (
      <CatalogEmptyState
        title={isLoggedIn || isGuest ? MICROCOPY.wishlist.emptyTitle : MICROCOPY.wishlist.guestTitle}
        description={
          isLoggedIn || isGuest
            ? MICROCOPY.wishlist.emptyDescription
            : MICROCOPY.wishlist.guestDescription
        }
        actionLabel={isLoggedIn || isGuest ? MICROCOPY.wishlist.shopCta : MICROCOPY.wishlist.signInCta}
        actionHref={isLoggedIn || isGuest ? "/products" : "/login?redirectTo=/wishlist"}
        mascot="bella-bunny"
      />
    );
  }

  function remove(productId: string) {
    startTransition(async () => {
      if (isLoggedIn) {
        await removeFromWishlistAction(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        const ids = readGuestWishlistIds().filter((id) => id !== productId);
        writeGuestWishlistIds(ids);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        refresh();
      }
      toast.info("Removed from wishlist");
    });
  }

  function moveToCart(product: StorefrontProduct) {
    cart?.addItem(product, null, 1);
    cartUi?.openMiniCart();
    toast.success("Added to cart");
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="relative flex flex-col">
            <ProductCard product={product} onQuickView={setQuickView} hideHoverActions hideWishlistButton />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              <button
                type="button"
                disabled={pending}
                aria-label={`Remove ${product.name} from wishlist`}
                onClick={() => remove(product.id)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-cream-300 text-terra-600 hover:bg-terra-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-green-700/70">
        <Link href="/products" className="font-semibold text-terra-600 hover:underline">
          Continue shopping
        </Link>
      </p>
      <QuickViewModal product={quickView} open={!!quickView} onOpenChange={(open) => !open && setQuickView(null)} />
    </>
  );
}
