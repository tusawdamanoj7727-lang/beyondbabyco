"use client";

import { useEffect } from "react";

import { useAuth } from "@/lib/auth/hooks";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { mergeGuestWishlistOnLogin } from "@/lib/storefront/cart-actions";
import {
  readGuestWishlistIds,
  writeGuestWishlistIds,
  WISHLIST_STORAGE_KEY,
} from "@/lib/storefront/wishlist-storage";

export default function CartSyncEffect() {
  const { user, loading } = useAuth();
  const cart = useCartOptional();

  useEffect(() => {
    if (loading || !cart) return;
    cart.setLoggedIn(!!user);
  }, [user, loading, cart]);

  useEffect(() => {
    if (loading || !user) return;

    const guestIds = readGuestWishlistIds();
    if (guestIds.length === 0) return;

    void mergeGuestWishlistOnLogin(guestIds).then(() => {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      writeGuestWishlistIds([]);
      window.dispatchEvent(new CustomEvent("bbc:wishlist-merged"));
    });
  }, [user, loading]);

  return null;
}
