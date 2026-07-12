"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildCartItemInput,
  legacyCouponToStore,
  legacyItemToStore,
  legacyItemsToStore,
  legacyVariantKey,
  storeCouponToLegacy,
  storeItemToLegacy,
} from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import {
  getServerCartItems,
  mergeGuestCartOnLogin,
  syncServerCartItems,
} from "@/lib/storefront/cart-actions";
import { readSavedStorage, writeSavedStorage } from "@/lib/storefront/cart-storage";
import {
  cartItemCount,
  cartLineKey,
  cartSubtotal,
  clampCartQuantity,
  productToCartItem,
  type AppliedCoupon,
  type CartItem,
  type CartProductInput,
} from "@/lib/storefront/cart-types";

type CartContextValue = {
  items: CartItem[];
  savedItems: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  isLoggedIn: boolean;
  appliedCoupon: AppliedCoupon | null;
  addItem: (
    product: CartProductInput,
    variantId?: string | null,
    quantity?: number,
    variantName?: string | null,
  ) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  saveForLater: (productId: string, variantId: string | null) => void;
  moveSavedToCart: (productId: string, variantId: string | null) => void;
  removeSaved: (productId: string, variantId: string | null) => void;
  clear: () => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  setLoggedIn: (loggedIn: boolean, userId?: string | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function currentLegacyItems(): CartItem[] {
  return useCartStore.getState().items.map(storeItemToLegacy);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const storeItems = useCartStore((s) => s.items);
  const storeCoupon = useCartStore((s) => s.coupon);

  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergedUserIdRef = useRef<string | null>(null);

  const items = useMemo(() => storeItems.map(storeItemToLegacy), [storeItems]);
  const appliedCoupon = useMemo(() => storeCouponToLegacy(storeCoupon), [storeCoupon]);

  useEffect(() => {
    setSavedItems(readSavedStorage());
    const finish = () => setHydrated(true);
    const unsub = useCartStore.persist.onFinishHydration(finish);
    finish();
    return unsub;
  }, []);

  const syncToServer = useCallback(
    (next: CartItem[]) => {
      if (!isLoggedIn) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        void syncServerCartItems(next);
      }, 600);
    },
    [isLoggedIn],
  );

  const setAppliedCoupon = useCallback((coupon: AppliedCoupon | null) => {
    if (coupon) useCartStore.getState().applyCoupon(legacyCouponToStore(coupon));
    else useCartStore.getState().removeCoupon();
  }, []);

  const setLoggedIn = useCallback(
    (loggedIn: boolean, userId?: string | null) => {
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        if (mergedUserIdRef.current !== null) {
          mergedUserIdRef.current = null;
        }
        return;
      }

      const uid = userId?.trim() || null;
      if (!uid || !hydrated || mergedUserIdRef.current === uid) return;

      mergedUserIdRef.current = uid;
      const local = currentLegacyItems();
      void mergeGuestCartOnLogin(local).then((result) => {
        if (result.ok && result.items) {
          useCartStore.getState().replaceItems(legacyItemsToStore(result.items));
          syncToServer(result.items);
        }
      });
    },
    [hydrated, syncToServer],
  );

  useEffect(() => {
    if (!isLoggedIn || !hydrated) return;

    const syncFromServer = () => {
      if (document.visibilityState !== "visible") return;
      void getServerCartItems().then((items) => {
        useCartStore.getState().replaceItems(legacyItemsToStore(items));
      });
    };

    document.addEventListener("visibilitychange", syncFromServer, { passive: true });
    return () => document.removeEventListener("visibilitychange", syncFromServer);
  }, [isLoggedIn, hydrated]);

  const addItem = useCallback(
    (
      product: CartProductInput,
      variantId: string | null = null,
      quantity = 1,
      variantName: string | null = null,
    ) => {
      const input = buildCartItemInput(product, { variantId, variantName });
      useCartStore.getState().addItem(input, clampCartQuantity(quantity));
      syncToServer(currentLegacyItems());
    },
    [syncToServer],
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      useCartStore.getState().updateQuantity(legacyVariantKey(variantId), clampCartQuantity(quantity));
      syncToServer(currentLegacyItems());
    },
    [syncToServer],
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null) => {
      useCartStore.getState().removeItem(legacyVariantKey(variantId));
      syncToServer(currentLegacyItems());
    },
    [syncToServer],
  );

  const saveForLater = useCallback(
    (productId: string, variantId: string | null) => {
      const key = cartLineKey(productId, variantId);
      const item = items.find((i) => cartLineKey(i.productId, i.variantId) === key);
      if (!item) return;
      useCartStore.getState().removeItem(legacyVariantKey(variantId));
      setSavedItems((saved) => {
        const savedNext = [...saved.filter((s) => cartLineKey(s.productId, s.variantId) !== key), item];
        writeSavedStorage(savedNext);
        return savedNext;
      });
      syncToServer(currentLegacyItems());
    },
    [items, syncToServer],
  );

  const moveSavedToCart = useCallback(
    (productId: string, variantId: string | null) => {
      const key = cartLineKey(productId, variantId);
      setSavedItems((saved) => {
        const item = saved.find((s) => cartLineKey(s.productId, s.variantId) === key);
        if (!item) return saved;
        const savedNext = saved.filter((s) => cartLineKey(s.productId, s.variantId) !== key);
        writeSavedStorage(savedNext);
        useCartStore.getState().replaceItems([
          ...useCartStore.getState().items,
          legacyItemToStore(item),
        ]);
        syncToServer(currentLegacyItems());
        return savedNext;
      });
    },
    [syncToServer],
  );

  const removeSaved = useCallback((productId: string, variantId: string | null) => {
    const key = cartLineKey(productId, variantId);
    setSavedItems((saved) => {
      const next = saved.filter((s) => cartLineKey(s.productId, s.variantId) !== key);
      writeSavedStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    useCartStore.getState().clearCart();
    syncToServer([]);
  }, [syncToServer]);

  const value = useMemo(
    () => ({
      items,
      savedItems,
      count: cartItemCount(items),
      subtotal: cartSubtotal(items),
      hydrated,
      isLoggedIn,
      appliedCoupon,
      addItem,
      updateQuantity,
      removeItem,
      saveForLater,
      moveSavedToCart,
      removeSaved,
      clear,
      setAppliedCoupon,
      setLoggedIn,
    }),
    [
      items,
      savedItems,
      hydrated,
      isLoggedIn,
      appliedCoupon,
      addItem,
      updateQuantity,
      removeItem,
      saveForLater,
      moveSavedToCart,
      removeSaved,
      clear,
      setAppliedCoupon,
      setLoggedIn,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartOptional() {
  return useContext(CartContext);
}

export type { CartItem, CartProductInput, AppliedCoupon, productToCartItem };
