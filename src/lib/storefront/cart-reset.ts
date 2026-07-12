import { useCartStore } from "@/lib/store/cart-store";
import {
  CART_STORAGE_KEY,
  SAVED_STORAGE_KEY,
  writeSavedStorage,
} from "@/lib/storefront/cart-storage";

export const GUEST_CART_SESSION_FLAG = "bbc-guest-cart-session";
const LEGACY_CART_STORAGE_KEY = "beyondbabyco-cart";
const PERSIST_STORAGE_KEY = "bbc-cart";

export function markGuestCartSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GUEST_CART_SESSION_FLAG, "1");
  } catch {
    // Ignore private mode / quota errors.
  }
}

export function clearGuestCartSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(GUEST_CART_SESSION_FLAG);
  } catch {
    // Ignore.
  }
}

export function hasGuestCartSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GUEST_CART_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Wipe all browser cart state so the next visitor/session starts clean. */
export function resetClientCart(): void {
  useCartStore.getState().clearCart();

  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(PERSIST_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(SAVED_STORAGE_KEY);
    void useCartStore.persist.clearStorage();
  } catch {
    // Ignore quota / private mode errors.
  }

  clearGuestCartSession();
  writeSavedStorage([]);
}
