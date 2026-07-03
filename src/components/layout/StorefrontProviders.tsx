"use client";

import type { Session } from "@supabase/supabase-js";

import { AuthProvider } from "@/lib/auth/auth-context";
import { NotifyMeProvider } from "@/lib/homepage/notify-me-context";
import { CartProvider } from "@/lib/storefront/cart-context";
import { CartUiProvider } from "@/lib/storefront/cart-ui-context";
import { WishlistProvider } from "@/lib/storefront/wishlist-context";
import CartSyncEffect from "@/components/catalog/CartSyncEffect";
import MiniCartDrawer from "@/components/catalog/MiniCartDrawer";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function StorefrontProviders({
  children,
  wishlistIds = [],
  initialSession = null,
}: {
  children: React.ReactNode;
  wishlistIds?: string[];
  initialSession?: Session | null;
}) {
  return (
    <AuthProvider initialSession={initialSession}>
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
    </AuthProvider>
  );
}
