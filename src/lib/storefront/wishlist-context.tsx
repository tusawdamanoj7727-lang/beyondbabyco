"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";

import { useAuth } from "@/lib/auth/hooks";
import { getWishlistProductIds, toggleWishlistAction } from "@/lib/storefront/wishlist-actions";
import {
  readGuestWishlistIds,
  writeGuestWishlistIds,
} from "@/lib/storefront/wishlist-storage";

type WishlistContextValue = {
  ids: Set<string>;
  loading: boolean;
  isGuest: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ ok: boolean; error: string | null }>;
  refresh: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  initialIds = [],
}: {
  children: React.ReactNode;
  initialIds?: string[];
}) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [loading, setLoading] = useState(initialIds.length === 0);
  const [, startTransition] = useTransition();
  const isGuest = !user && !authLoading;

  const refresh = useCallback(() => {
    if (user) {
      getWishlistProductIds()
        .then((list) => setIds(new Set(list)))
        .finally(() => setLoading(false));
    } else {
      setIds(new Set(readGuestWishlistIds()));
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (initialIds.length > 0 && !loading) return;
      refresh();
    } else {
      setIds(new Set(readGuestWishlistIds()));
      setLoading(false);
    }
  }, [user, authLoading, initialIds.length, refresh, loading]);

  useEffect(() => {
    function onMerged() {
      refresh();
    }
    window.addEventListener("bbc:wishlist-merged", onMerged);
    return () => window.removeEventListener("bbc:wishlist-merged", onMerged);
  }, [refresh]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      if (user) {
        const result = await toggleWishlistAction(productId);
        if (result.ok) {
          startTransition(() => {
            setIds((prev) => {
              const next = new Set(prev);
              if (result.inWishlist) next.add(productId);
              else next.delete(productId);
              return next;
            });
          });
        }
        return { ok: result.ok, error: result.error };
      }

      const guestIds = readGuestWishlistIds();
      const inList = guestIds.includes(productId);
      const next = inList ? guestIds.filter((id) => id !== productId) : [...guestIds, productId];
      writeGuestWishlistIds(next);
      setIds(new Set(next));
      return { ok: true, error: null };
    },
    [user],
  );

  const value = useMemo(
    () => ({ ids, loading, isGuest, isWishlisted, toggle, refresh }),
    [ids, loading, isGuest, isWishlisted, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      ids: new Set<string>(),
      loading: false,
      isGuest: true,
      isWishlisted: () => false,
      toggle: async () => ({ ok: false, error: "Wishlist unavailable" }),
      refresh: () => {},
    };
  }
  return ctx;
}
