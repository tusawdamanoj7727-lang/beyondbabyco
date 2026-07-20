"use client";

import dynamic from "next/dynamic";

import StorefrontErrorBoundary from "@/components/ui/StorefrontErrorBoundary";
import type { CheckoutInitialData } from "@/lib/checkout/actions";

const CheckoutClient = dynamic(() => import("@/components/checkout/CheckoutClient"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[420px] animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <div className="h-40 rounded-3xl bg-green-50/80" />
        <div className="h-56 rounded-3xl bg-green-50/80" />
        <div className="h-40 rounded-3xl bg-green-50/80" />
      </div>
      <div className="h-72 rounded-3xl bg-green-50/80" />
    </div>
  ),
});

export default function CheckoutRoute({ initial }: { initial: CheckoutInitialData }) {
  return (
    <StorefrontErrorBoundary context="checkout">
      <CheckoutClient initial={initial} />
    </StorefrontErrorBoundary>
  );
}
