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
import {
  clearGuestCartSession,
  hasGuestCartSession,
  resetClientCart,
} from "@/lib/storefront/cart-reset";
import { readSavedStorage, writeSavedStorage } from "@/lib/storefront/cart-storage";
import {
  cartItemCount,
  cartLineKey,
  cartSubtotal,
  clampCartQuantity,
  mergeCartItems,
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
  const isLoggedInRef = useRef(false);

  const items = useMemo(() => storeItems.map(storeItemToLegacy), [storeItems]);
  const appliedCoupon = useMemo(() => storeCouponToLegacy(storeCoupon), [storeCoupon]);

  useEffect(() => {
    setSavedItems(readSavedStorage());
    const finish = () => setHydrated(true);
    if (useCartStore.persist.hasHydrated()) {
      finish();
    } else {
      return useCartStore.persist.onFinishHydration(finish);
    }
  }, []);

  const syncToServer = useCallback(
    (_next: CartItem[]) => {
      if (!isLoggedIn) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        void syncServerCartItems(currentLegacyItems());
      }, 600);
    },
    [isLoggedIn],
  );

  const cancelServerSync = useCallback(() => {
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
  }, []);

  const setAppliedCoupon = useCallback((coupon: AppliedCoupon | null) => {
    if (coupon) useCartStore.getState().applyCoupon(legacyCouponToStore(coupon));
    else useCartStore.getState().removeCoupon();
  }, []);

  const setLoggedIn = useCallback(
    (loggedIn: boolean, userId?: string | null) => {
      if (!loggedIn) {
        cancelServerSync();
        if (isLoggedInRef.current) {
          resetClientCart();
          setSavedItems([]);
          mergedUserIdRef.current = null;
        }
        isLoggedInRef.current = false;
        setIsLoggedIn(false);
        return;
      }

      isLoggedInRef.current = true;
      setIsLoggedIn(true);
      const uid = userId?.trim() || null;
      if (!uid || !hydrated) return;
      if (mergedUserIdRef.current === uid) return;

      const previousUid = mergedUserIdRef.current;
      mergedUserIdRef.current = uid;

      const accountSwap = previousUid !== null && previousUid !== uid;
      const guestLocal = accountSwap ? [] : currentLegacyItems();
      const shouldMergeGuest =
        !accountSwap && hasGuestCartSession() && guestLocal.length > 0;

      cancelServerSync();

      void (async () => {
        if (shouldMergeGuest) {
          const result = await mergeGuestCartOnLogin(guestLocal);
          clearGuestCartSession();
          if (result.ok && result.items) {
            useCartStore.getState().replaceItems(legacyItemsToStore(result.items));
            return;
          }
        }

        if (accountSwap) {
          resetClientCart();
        }

        const localItems = accountSwap ? [] : currentLegacyItems();
        const serverItems = await getServerCartItems();
        const merged = mergeCartItems(localItems, serverItems);
        useCartStore.getState().replaceItems(legacyItemsToStore(merged));

        if (merged.length > 0 && localItems.length > 0) {
          void syncServerCartItems(merged);
        }
      })();
    },
    [cancelServerSync, hydrated],
  );

  // Removed visibilitychange sync — it raced with debounced syncToServer and re-applied
  // server state on every tab focus, causing quantity drift after failed merge fixes.

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
