"use client";

import { useEffect, useRef } from "react";

import type { StorefrontProduct, StorefrontProductDetail } from "@/lib/catalog/types";
import { analyticsItemFromProduct } from "@/lib/analytics/items";
import { trackViewItem } from "@/lib/analytics/events";

export default function ProductAnalyticsTracker({
  product,
}: {
  product: StorefrontProduct | StorefrontProductDetail;
}) {
  const trackedRef = useRef<string>("");

  useEffect(() => {
    if (trackedRef.current === product.id) return;
    trackedRef.current = product.id;
    trackViewItem({
      value: product.effectivePrice,
      items: [analyticsItemFromProduct(product)],
      contentName: product.name,
    });
  }, [product]);

  return null;
}
