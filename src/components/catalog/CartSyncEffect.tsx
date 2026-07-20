"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth/hooks";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { mergeGuestWishlistOnLogin } from "@/lib/storefront/cart-actions";
import { markGuestCartSession } from "@/lib/storefront/cart-reset";
import {
  readGuestWishlistIds,
  writeGuestWishlistIds,
  WISHLIST_STORAGE_KEY,
} from "@/lib/storefront/wishlist-storage";

export default function CartSyncEffect() {
  const { user, loading } = useAuth();
  const cart = useCartOptional();
  const setLoggedIn = cart?.setLoggedIn;
  const hydrated = cart?.hydrated ?? false;
  const userId = user?.id ?? null;
  const prevItemCountRef = useRef(0);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading || !setLoggedIn || !hydrated) return;

    const applyLogin = () => {
      if (userId) {
        setLoggedIn(true, userId);
      } else if (prevUserIdRef.current) {
        setLoggedIn(false);
      }
      prevUserIdRef.current = userId;
    };

    if (!userId) {
      applyLogin();
      return;
    }

    let cancelled = false;
    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof g.requestIdleCallback === "function") {
      const idleId = g.requestIdleCallback(() => {
        if (!cancelled) applyLogin();
      }, { timeout: 2000 });
      return () => {
        cancelled = true;
        if (typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(applyLogin, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [userId, loading, setLoggedIn, hydrated]);

  useEffect(() => {
    if (loading || userId) return;

    prevItemCountRef.current = useCartStore.getState().itemCount();
    return useCartStore.subscribe((state) => {
      const count = state.itemCount();
      if (count > prevItemCountRef.current) {
        markGuestCartSession();
      }
      prevItemCountRef.current = count;
    });
  }, [userId, loading]);

  useEffect(() => {
    if (loading || !userId) return;

    const guestIds = readGuestWishlistIds();
    if (guestIds.length === 0) return;

    let cancelled = false;
    const merge = () => {
      if (cancelled) return;
      void mergeGuestWishlistOnLogin(guestIds).then(() => {
        if (cancelled) return;
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
        writeGuestWishlistIds([]);
        window.dispatchEvent(new CustomEvent("bbc:wishlist-merged"));
      });
    };

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof g.requestIdleCallback === "function") {
      const idleId = g.requestIdleCallback(merge, { timeout: 3000 });
      return () => {
        cancelled = true;
        if (typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(merge, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [userId, loading]);

  return null;
}
