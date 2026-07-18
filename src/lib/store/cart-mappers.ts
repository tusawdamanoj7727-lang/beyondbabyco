import { resolveProductGstRate } from "@/lib/catalog/gst-rates";
import { productUnit } from "@/lib/catalog/product-images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import type { AppliedCoupon as StoreCoupon, CartItem as StoreCartItem } from "@/lib/store/cart-store";
import type { AppliedCoupon as LegacyCoupon, CartItem as LegacyCartItem, CartProductInput } from "@/lib/storefront/cart-types";

export const DEFAULT_VARIANT_ID = "default";

export function legacyVariantKey(variantId: string | null): string {
  return variantId ?? DEFAULT_VARIANT_ID;
}

export function storeVariantToLegacy(variantId: string | null | undefined): string | null {
  if (variantId == null || variantId === DEFAULT_VARIANT_ID) return null;
  return variantId;
}

function defaultVariantFromProduct(
  product: CartProductInput | StorefrontProduct,
): { id: string | null; name: string | null } {
  if ("variants" in product && Array.isArray(product.variants) && product.variants[0]) {
    const v = product.variants[0];
    return { id: v.id ?? null, name: v.name ?? null };
  }
  return { id: null, name: null };
}

export function buildCartItemInput(
  product: CartProductInput | StorefrontProduct,
  options?: { variantId?: string | null; variantName?: string | null },
): Omit<StoreCartItem, "quantity"> {
  const fallback = defaultVariantFromProduct(product);
  const resolvedVariantId = options?.variantId ?? fallback.id;
  const variantKey = legacyVariantKey(resolvedVariantId);
  const price = product.effectivePrice ?? product.price;
  const originalPrice = product.compareAtPrice ?? price;
  const unit =
    options?.variantName?.trim() || fallback.name?.trim() || productUnit(product.slug);

  return {
    id: `${product.id}:${variantKey}`,
    productId: product.id,
    variantId: variantKey,
    name: product.name,
    unit,
    variantName: unit,
    price,
    originalPrice,
    image: product.imageUrl ?? "",
    slug: product.slug,
    gstRate: resolveProductGstRate(product.gstRate, product.categorySlug, product.slug),
  };
}

export function legacyItemToStore(item: LegacyCartItem): StoreCartItem {
  return {
    id: `${item.productId}:${legacyVariantKey(item.variantId)}`,
    productId: item.productId,
    variantId: legacyVariantKey(item.variantId),
    name: item.name,
    unit: item.variantName ?? "",
    variantName: item.variantName ?? "",
    price: item.price,
    originalPrice: item.compareAtPrice ?? item.price,
    quantity: item.quantity,
    image: item.imageUrl ?? "",
    slug: item.slug,
    gstRate: item.gstRate,
  };
}

export function storeItemToLegacy(item: StoreCartItem): LegacyCartItem {
  return {
    productId: item.productId,
    variantId: storeVariantToLegacy(item.variantId),
    quantity: item.quantity,
    addedAt: Date.now(),
    name: item.name,
    slug: item.slug,
    price: item.price,
    compareAtPrice: item.originalPrice > item.price ? item.originalPrice : null,
    variantName: item.variantName || item.unit || null,
    imageUrl: item.image || null,
    categoryId: null,
    brandId: null,
    stock: 99,
    inStock: true,
    gstRate: item.gstRate,
  };
}

export function storeCouponToLegacy(coupon: StoreCoupon | null): LegacyCoupon | null {
  if (!coupon) return null;
  return {
    code: coupon.code,
    couponId: "",
    discountAmount: coupon.savings,
    freeShipping: false,
  };
}

export function legacyCouponToStore(coupon: LegacyCoupon): StoreCoupon {
  return {
    code: coupon.code,
    discountType: "flat",
    discountValue: coupon.discountAmount,
    savings: coupon.discountAmount,
  };
}

export function apiCouponToStore(coupon: {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  savings: number;
}): StoreCoupon {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    savings: coupon.savings,
  };
}

export function legacyItemsToStore(items: LegacyCartItem[]): StoreCartItem[] {
  return items.map(legacyItemToStore);
}
