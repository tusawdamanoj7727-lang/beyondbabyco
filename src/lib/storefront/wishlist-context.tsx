"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/hooks";
import {
  readGuestWishlistIds,
  writeGuestWishlistIds,
  WISHLIST_STORAGE_KEY,
} from "@/lib/storefront/wishlist-storage";

type WishlistContextValue = {
  ids: Set<string>;
  loading: boolean;
  hydrated: boolean;
  isGuest: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ ok: boolean; error: string | null }>;
  remove: (productId: string) => Promise<{ ok: boolean; error: string | null }>;
  refresh: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const SIGN_IN_ERROR = "Sign in to save items to your wishlist.";

async function fetchWishlistIds(): Promise<string[]> {
  const res = await fetch("/api/wishlist", { method: "GET", credentials: "same-origin", cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { ids?: string[] };
  return Array.isArray(data.ids) ? data.ids.filter((id) => typeof id === "string") : [];
}

async function postWishlistToggle(productId: string): Promise<{ ok: boolean; error: string | null; inWishlist?: boolean }> {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string | null; inWishlist?: boolean }
    | null;
  if (!data || typeof data.ok !== "boolean") {
    return { ok: false, error: "Wishlist request failed." };
  }
  return { ok: data.ok, error: data.error ?? null, inWishlist: data.inWishlist };
}

async function postWishlistRemove(productId: string): Promise<{ ok: boolean; error: string | null }> {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, action: "remove" }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string | null } | null;
  if (!data || typeof data.ok !== "boolean") {
    return { ok: false, error: "Wishlist request failed." };
  }
  return { ok: data.ok, error: data.error ?? null };
}

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
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(initialIds.length > 0);
  const fetchGen = useRef(0);
  const mutationGen = useRef(0);
  const userId = user?.id ?? null;
  const isGuest = !user && !authLoading;

  const refresh = useCallback(() => {
    const gen = ++fetchGen.current;
    const mutationAtStart = mutationGen.current;
    setLoading(true);

    fetchWishlistIds()
      .then((list) => {
        if (gen !== fetchGen.current) return;
        if (mutationAtStart !== mutationGen.current) return;
        if (list.length > 0 || userId) {
          setIds(new Set(list));
          return;
        }
        setIds(new Set(readGuestWishlistIds()));
      })
      .catch(() => {
        if (gen !== fetchGen.current) return;
        if (mutationAtStart !== mutationGen.current) return;
        if (!userId) setIds(new Set(readGuestWishlistIds()));
      })
      .finally(() => {
        if (gen === fetchGen.current) {
          setLoading(false);
          setHydrated(true);
        }
      });
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;

    if (initialKey) {
      setIds(new Set(initialKey.split(",").filter(Boolean)));
      setHydrated(true);
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
    mutationGen.current += 1;
    const mutation = mutationGen.current;

    let wasIn = false;
    setIds((prev) => {
      wasIn = prev.has(productId);
      const next = new Set(prev);
      if (wasIn) next.delete(productId);
      else next.add(productId);
      return next;
    });

    const result = await postWishlistToggle(productId);

    if (mutation !== mutationGen.current) {
      return { ok: true, error: null };
    }

    if (result.ok) {
      setIds((prev) => {
        const next = new Set(prev);
        if (result.inWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return { ok: true, error: null };
    }

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

  const remove = useCallback(async (productId: string) => {
    mutationGen.current += 1;
    const mutation = mutationGen.current;

    setIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });

    const result = await postWishlistRemove(productId);

    if (mutation !== mutationGen.current) {
      return { ok: true, error: null };
    }

    if (result.ok) {
      return { ok: true, error: null };
    }

    if (result.error === "Not signed in.") {
      const next = readGuestWishlistIds().filter((id) => id !== productId);
      writeGuestWishlistIds(next);
      setIds(new Set(next));
      return { ok: true, error: null };
    }

    // Roll back by refreshing from server/guest storage.
    refresh();
    return { ok: false, error: result.error };
  }, [refresh]);

  const value = useMemo(
    () => ({ ids, loading, hydrated, isGuest, isWishlisted, toggle, remove, refresh }),
    [ids, loading, hydrated, isGuest, isWishlisted, toggle, remove, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      ids: new Set<string>(),
      loading: false,
      hydrated: true,
      isGuest: true,
      isWishlisted: () => false,
      toggle: async () => ({ ok: false, error: "Wishlist unavailable" }),
      remove: async () => ({ ok: false, error: "Wishlist unavailable" }),
      refresh: () => {},
    };
  }
  return ctx;
}
