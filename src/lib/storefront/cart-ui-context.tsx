"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type CartUiContextValue = {
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
  openMiniCart: () => void;
};

const CartUiContext = createContext<CartUiContextValue | null>(null);

/** Isolated mini-cart UI state — toggling the drawer does not rerender cart data consumers. */
export function CartUiProvider({ children }: { children: React.ReactNode }) {
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const openMiniCart = useCallback(() => setMiniCartOpen(true), []);

  const value = useMemo(
    () => ({ miniCartOpen, setMiniCartOpen, openMiniCart }),
    [miniCartOpen, openMiniCart],
  );

  return <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>;
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error("useCartUi must be used within CartUiProvider");
  return ctx;
}

export function useCartUiOptional() {
  return useContext(CartUiContext);
}
