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
  mergeGuestCartOnLogin,
  syncServerCartItems,
} from "@/lib/storefront/cart-actions";
import {
  readCartStorage,
  readSavedStorage,
  writeCartStorage,
  writeSavedStorage,
} from "@/lib/storefront/cart-storage";
import {
  cartItemCount,
  cartLineKey,
  cartSubtotal,
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
  setLoggedIn: (loggedIn: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const COUPON_STORAGE_KEY = "bbc_cart_coupon_v1";

function readCoupon(): AppliedCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppliedCoupon) : null;
  } catch {
    return null;
  }
}

function writeCoupon(coupon: AppliedCoupon | null) {
  if (typeof window === "undefined") return;
  if (coupon) localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
  else localStorage.removeItem(COUPON_STORAGE_KEY);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergedRef = useRef(false);

  useEffect(() => {
    setItems(readCartStorage());
    setSavedItems(readSavedStorage());
    setAppliedCouponState(readCoupon());
    setHydrated(true);
  }, []);

  const persistItems = useCallback(
    (next: CartItem[]) => {
      setItems(next);
      writeCartStorage(next);
      if (isLoggedIn) {
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
          void syncServerCartItems(next);
        }, 600);
      }
    },
    [isLoggedIn],
  );

  const setAppliedCoupon = useCallback((coupon: AppliedCoupon | null) => {
    setAppliedCouponState(coupon);
    writeCoupon(coupon);
  }, []);

  const setLoggedIn = useCallback(
    (loggedIn: boolean) => {
      setIsLoggedIn(loggedIn);
      if (loggedIn && hydrated && !mergedRef.current) {
        mergedRef.current = true;
        const local = readCartStorage();
        void mergeGuestCartOnLogin(local).then((result) => {
          if (result.ok && result.items) {
            setItems(result.items);
            writeCartStorage(result.items);
          }
        });
      }
      if (!loggedIn) {
        mergedRef.current = false;
      }
    },
    [hydrated],
  );

  const addItem = useCallback(
    (
      product: CartProductInput,
      variantId: string | null = null,
      quantity = 1,
      variantName: string | null = null,
    ) => {
      setItems((prev) => {
        const key = cartLineKey(product.id, variantId);
        const existing = prev.find((i) => cartLineKey(i.productId, i.variantId) === key);
        let next: CartItem[];
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, Math.max(product.stock, 99));
          next = prev.map((i) =>
            cartLineKey(i.productId, i.variantId) === key
              ? {
                  ...productToCartItem(product, variantId, variantName ?? i.variantName, newQty),
                  addedAt: i.addedAt,
                }
              : i,
          );
        } else {
          const cappedQty = Math.min(quantity, Math.max(product.stock, 1));
          next = [...prev, productToCartItem(product, variantId, variantName, cappedQty)];
        }
        writeCartStorage(next);
        if (isLoggedIn) {
          if (syncTimer.current) clearTimeout(syncTimer.current);
          syncTimer.current = setTimeout(() => void syncServerCartItems(next), 600);
        }
        return next;
      });
    },
    [isLoggedIn],
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setItems((prev) => {
        const key = cartLineKey(productId, variantId);
        const next =
          quantity <= 0
            ? prev.filter((i) => cartLineKey(i.productId, i.variantId) !== key)
            : prev.map((i) =>
                cartLineKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: Math.min(quantity, Math.max(i.stock, 99)) }
                  : i,
              );
        writeCartStorage(next);
        if (isLoggedIn) {
          if (syncTimer.current) clearTimeout(syncTimer.current);
          syncTimer.current = setTimeout(() => void syncServerCartItems(next), 600);
        }
        return next;
      });
    },
    [isLoggedIn],
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null) => {
      const key = cartLineKey(productId, variantId);
      setItems((prev) => {
        const next = prev.filter((i) => cartLineKey(i.productId, i.variantId) !== key);
        writeCartStorage(next);
        if (isLoggedIn) {
          if (syncTimer.current) clearTimeout(syncTimer.current);
          syncTimer.current = setTimeout(() => void syncServerCartItems(next), 600);
        }
        return next;
      });
    },
    [isLoggedIn],
  );

  const saveForLater = useCallback(
    (productId: string, variantId: string | null) => {
      const key = cartLineKey(productId, variantId);
      setItems((prev) => {
        const item = prev.find((i) => cartLineKey(i.productId, i.variantId) === key);
        if (!item) return prev;
        const next = prev.filter((i) => cartLineKey(i.productId, i.variantId) !== key);
        writeCartStorage(next);
        setSavedItems((saved) => {
          const savedNext = [...saved.filter((s) => cartLineKey(s.productId, s.variantId) !== key), item];
          writeSavedStorage(savedNext);
          return savedNext;
        });
        if (isLoggedIn) void syncServerCartItems(next);
        return next;
      });
    },
    [isLoggedIn],
  );

  const moveSavedToCart = useCallback(
    (productId: string, variantId: string | null) => {
      const key = cartLineKey(productId, variantId);
      setSavedItems((saved) => {
        const item = saved.find((s) => cartLineKey(s.productId, s.variantId) === key);
        if (!item) return saved;
        const savedNext = saved.filter((s) => cartLineKey(s.productId, s.variantId) !== key);
        writeSavedStorage(savedNext);
        setItems((prev) => {
          const existing = prev.find((i) => cartLineKey(i.productId, i.variantId) === key);
          const next = existing
            ? prev.map((i) =>
                cartLineKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              )
            : [...prev, item];
          writeCartStorage(next);
          if (isLoggedIn) void syncServerCartItems(next);
          return next;
        });
        return savedNext;
      });
    },
    [isLoggedIn],
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
    persistItems([]);
    setAppliedCoupon(null);
  }, [persistItems, setAppliedCoupon]);

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

export type { CartItem, CartProductInput, AppliedCoupon };
