"use client";

import dynamic from "next/dynamic";
import { NotifyMeProvider } from "@/lib/homepage/notify-me-context";
import { CartProvider } from "@/lib/storefront/cart-context";
import { CartUiProvider } from "@/lib/storefront/cart-ui-context";
import { WishlistProvider } from "@/lib/storefront/wishlist-context";
import CartSyncEffect from "@/components/catalog/CartSyncEffect";
import { ToastProvider } from "@/components/ui/ToastProvider";

const MiniCartDrawer = dynamic(() => import("@/components/catalog/MiniCartDrawer"), {
  ssr: false,
});

export default function StorefrontProviders({
  children,
  wishlistIds = [],
}: {
  children: React.ReactNode;
  wishlistIds?: string[];
}) {
  return (
    <NotifyMeProvider>
      <ToastProvider>
        <CartUiProvider>
          <CartProvider>
            <WishlistProvider initialIds={wishlistIds}>
              <CartSyncEffect />
              <MiniCartDrawer />
              {children}
            </WishlistProvider>
          </CartProvider>
        </CartUiProvider>
      </ToastProvider>
    </NotifyMeProvider>
  );
}
