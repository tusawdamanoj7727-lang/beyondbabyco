"use client";

import dynamic from "next/dynamic";

const ProductViewTracker = dynamic(() => import("@/components/catalog/ProductViewTracker"), {
  ssr: false,
});

export default function DeferredProductViewTracker({ productId }: { productId: string }) {
  return <ProductViewTracker productId={productId} />;
}
