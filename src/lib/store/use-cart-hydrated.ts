"use client";

import { useEffect, useState } from "react";

import { useCartStore } from "@/lib/store/cart-store";

/** Avoid SSR/localStorage mismatch for persisted cart badge counts. */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useCartStore.persist.hasHydrated()) {
      finish();
      return;
    }
    return useCartStore.persist.onFinishHydration(finish);
  }, []);

  return hydrated;
}

export function useCartItemCount() {
  const hydrated = useCartHydrated();
  const count = useCartStore((s) =>
    s.items.reduce((total, item) => total + item.quantity, 0),
  );
  return hydrated ? count : 0;
}
