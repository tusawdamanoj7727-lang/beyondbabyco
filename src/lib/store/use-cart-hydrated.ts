"use client";

import { useEffect, useState } from "react";

import { useCartStore } from "@/lib/store/cart-store";

/** Avoid SSR/localStorage mismatch for persisted cart badge counts. */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useCartStore.persist.onFinishHydration(finish);
    finish();
    return unsub;
  }, []);

  return hydrated;
}

export function useCartItemCount() {
  const hydrated = useCartHydrated();
  const count = useCartStore((s) => s.itemCount());
  return hydrated ? count : 0;
}
