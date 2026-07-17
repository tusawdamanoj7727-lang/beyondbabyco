"use client";

import type { StorefrontProduct, StorefrontProductDetail } from "@/lib/catalog/types";
import type { AnalyticsItem } from "@/lib/analytics/events";

type AnalyticsCartLikeItem = {
  productId: string;
  name: string;
  unit?: string | null;
  variantName?: string | null;
  price: number;
  originalPrice?: number;
  quantity: number;
};

export function analyticsItemFromProduct(
  product: StorefrontProduct | StorefrontProductDetail,
  options?: {
    quantity?: number;
    itemListId?: string;
    itemListName?: string;
    coupon?: string;
    variant?: string | null;
  },
): AnalyticsItem {
  const compareAt = product.compareAtPrice ?? product.price ?? product.effectivePrice;
  const price = product.effectivePrice;

  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brandName ?? "BeyondBabyCo",
    item_category: product.categoryName ?? undefined,
    item_category2: product.subcategoryName ?? undefined,
    item_variant: options?.variant ?? undefined,
    item_list_id: options?.itemListId,
    item_list_name: options?.itemListName,
    price,
    quantity: options?.quantity ?? 1,
    discount: compareAt > price ? Number((compareAt - price).toFixed(2)) : undefined,
    coupon: options?.coupon,
    currency: "INR",
  };
}

export function analyticsItemFromCartItem(item: AnalyticsCartLikeItem, coupon?: string): AnalyticsItem {
  const originalPrice = item.originalPrice ?? item.price;
  const discount = originalPrice > item.price ? Number((originalPrice - item.price).toFixed(2)) : undefined;
  return {
    item_id: item.productId,
    item_name: item.name,
    item_variant: item.unit || item.variantName || undefined,
    price: item.price,
    quantity: item.quantity,
    discount,
    coupon,
    currency: "INR",
  };
}
