import type { StorefrontProduct } from "@/lib/catalog/types";
import { resolveProductGstRate } from "@/lib/catalog/gst-rates";

export interface CartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  addedAt: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  variantName: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  brandId: string | null;
  stock: number;
  inStock: boolean;
  /** GST percentage (12 baby care, 18 cosmetics). */
  gstRate: number;
}

/** Max quantity per line on the cart page. */
export const CART_MAX_QUANTITY = 10;
export const CART_MIN_QUANTITY = 1;

export function clampCartQuantity(quantity: number): number {
  return Math.min(CART_MAX_QUANTITY, Math.max(CART_MIN_QUANTITY, Math.round(quantity)));
}

export type CartProductInput = Pick<
  StorefrontProduct,
  | "id"
  | "name"
  | "slug"
  | "imageUrl"
  | "categoryId"
  | "brandId"
  | "stock"
  | "inStock"
  | "compareAtPrice"
  | "effectivePrice"
  | "price"
  | "gstRate"
  | "categorySlug"
>;

export interface AppliedCoupon {
  code: string;
  couponId: string;
  discountAmount: number;
  freeShipping: boolean;
}

export function cartLineKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "default"}`;
}

export function productToCartItem(
  product: CartProductInput,
  variantId: string | null = null,
  variantName: string | null = null,
  quantity = 1,
): CartItem {
  const price = product.effectivePrice ?? product.price;
  return {
    productId: product.id,
    variantId,
    quantity: clampCartQuantity(quantity),
    addedAt: Date.now(),
    name: product.name,
    slug: product.slug,
    price,
    compareAtPrice: product.compareAtPrice,
    variantName,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    brandId: product.brandId,
    stock: product.stock,
    inStock: product.inStock,
    gstRate: resolveProductGstRate(product.gstRate, product.categorySlug, product.slug),
  };
}

export function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of remote) {
    map.set(cartLineKey(item.productId, item.variantId), {
      ...item,
      quantity: clampCartQuantity(item.quantity),
    });
  }

  for (const item of local) {
    const key = cartLineKey(item.productId, item.variantId);
    const existing = map.get(key);
    if (existing) {
      const mergedQty = clampCartQuantity(existing.quantity + item.quantity);
      map.set(key, {
        ...existing,
        quantity: mergedQty,
        addedAt: Math.min(existing.addedAt, item.addedAt),
        name: item.name || existing.name,
        slug: item.slug || existing.slug,
        price: item.price || existing.price,
        compareAtPrice: item.compareAtPrice ?? existing.compareAtPrice,
        variantName: item.variantName ?? existing.variantName,
        imageUrl: item.imageUrl ?? existing.imageUrl,
        inStock: item.inStock ?? existing.inStock,
        stock: Math.max(item.stock, existing.stock),
      });
    } else {
      map.set(key, { ...item, quantity: clampCartQuantity(item.quantity) });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.addedAt - b.addedAt);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartMrpTotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.compareAtPrice ?? item.price) * item.quantity,
    0,
  );
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
