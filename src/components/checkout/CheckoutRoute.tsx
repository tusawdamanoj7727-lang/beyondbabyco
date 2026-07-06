"use client";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import StorefrontErrorBoundary from "@/components/ui/StorefrontErrorBoundary";
import type { CheckoutInitialData } from "@/lib/checkout/actions";

export default function CheckoutRoute({ initial }: { initial: CheckoutInitialData }) {
  return (
    <StorefrontErrorBoundary context="checkout">
      <CheckoutClient initial={initial} />
    </StorefrontErrorBoundary>
  );
}
