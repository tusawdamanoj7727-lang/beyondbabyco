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
  const setLoggedIn = useCartOptional()?.setLoggedIn;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (loading || !setLoggedIn) return;
    setLoggedIn(Boolean(userId), userId);
  }, [userId, loading, setLoggedIn]);

  useEffect(() => {
    if (loading || !userId) return;

    const guestIds = readGuestWishlistIds();
    if (guestIds.length === 0) return;

    void mergeGuestWishlistOnLogin(guestIds).then(() => {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      writeGuestWishlistIds([]);
      window.dispatchEvent(new CustomEvent("bbc:wishlist-merged"));
    });
  }, [userId, loading]);

  return null;
}
