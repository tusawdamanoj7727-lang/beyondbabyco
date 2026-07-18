"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/hooks";
import { getWishlistProductIds, toggleWishlistAction } from "@/lib/storefront/wishlist-actions";
import {
  readGuestWishlistIds,
  writeGuestWishlistIds,
  WISHLIST_STORAGE_KEY,
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

const SIGN_IN_ERROR = "Sign in to save items to your wishlist.";

export function WishlistProvider({
  children,
  initialIds = [],
}: {
  children: React.ReactNode;
  initialIds?: string[];
}) {
  const { user, loading: authLoading } = useAuth();
  const initialKey = initialIds.join(",");
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [loading, setLoading] = useState(false);
  const fetchGen = useRef(0);
  const userId = user?.id ?? null;
  const isGuest = !user && !authLoading;

  const refresh = useCallback(() => {
    const gen = ++fetchGen.current;
    setLoading(true);

    // Always hit the server action first — auth cookies work even when the
    // browser client session has not hydrated yet.
    getWishlistProductIds()
      .then((list) => {
        if (gen !== fetchGen.current) return;
        if (list.length > 0 || userId) {
          setIds(new Set(list));
          return;
        }
        setIds(new Set(readGuestWishlistIds()));
      })
      .catch(() => {
        if (gen !== fetchGen.current) return;
        if (!userId) setIds(new Set(readGuestWishlistIds()));
      })
      .finally(() => {
        if (gen !== fetchGen.current) return;
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;

    if (initialKey) {
      setIds(new Set(initialKey.split(",").filter(Boolean)));
    }
    refresh();
  }, [userId, authLoading, refresh, initialKey]);

  useEffect(() => {
    function onMerged() {
      refresh();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === WISHLIST_STORAGE_KEY) refresh();
    }
    window.addEventListener("bbc:wishlist-merged", onMerged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bbc:wishlist-merged", onMerged);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(async (productId: string) => {
    // Invalidate in-flight refreshes so a stale empty fetch cannot wipe this toggle.
    ++fetchGen.current;

    let wasIn = false;
    setIds((prev) => {
      wasIn = prev.has(productId);
      const next = new Set(prev);
      if (wasIn) next.delete(productId);
      else next.add(productId);
      return next;
    });

    const result = await toggleWishlistAction(productId);

    if (result.ok) {
      setIds((prev) => {
        const next = new Set(prev);
        if (result.inWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return { ok: true, error: null };
    }

    // Cookie session missing → guest localStorage fallback.
    if (result.error === SIGN_IN_ERROR) {
      const guestIds = readGuestWishlistIds();
      const inList = guestIds.includes(productId);
      const next = inList ? guestIds.filter((id) => id !== productId) : [...guestIds, productId];
      writeGuestWishlistIds(next);
      setIds(new Set(next));
      return { ok: true, error: null };
    }

    setIds((prev) => {
      const next = new Set(prev);
      if (wasIn) next.add(productId);
      else next.delete(productId);
      return next;
    });
    return { ok: false, error: result.error };
  }, []);

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
