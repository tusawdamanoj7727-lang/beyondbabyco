"use client";

import dynamic from "next/dynamic";
import { NotifyMeProvider } from "@/lib/homepage/notify-me-context";
import { CartProvider } from "@/lib/storefront/cart-context";
import { CartUiProvider, useCartUi } from "@/lib/storefront/cart-ui-context";
import { WishlistProvider } from "@/lib/storefront/wishlist-context";
import CartSyncEffect from "@/components/catalog/CartSyncEffect";
import { ToastProvider } from "@/components/ui/ToastProvider";

const MiniCartDrawer = dynamic(() => import("@/components/catalog/MiniCartDrawer"), {
  ssr: false,
});

/** Mount drawer only when opened — avoids cart math + Radix on every page load. */
function MiniCartGate() {
  const { miniCartOpen } = useCartUi();
  if (!miniCartOpen) return null;
  return <MiniCartDrawer />;
}

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
              <MiniCartGate />
              {children}
            </WishlistProvider>
          </CartProvider>
        </CartUiProvider>
      </ToastProvider>
    </NotifyMeProvider>
  );
}
