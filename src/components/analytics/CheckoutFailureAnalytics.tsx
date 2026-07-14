"use client";

import { useEffect } from "react";

import { trackPaymentFailure } from "@/lib/analytics/events";

export default function CheckoutFailureAnalytics({
  orderId,
  reason,
}: {
  orderId?: string;
  reason?: string;
}) {
  useEffect(() => {
    trackPaymentFailure({ orderId, reason: reason ?? "failed" });
  }, [orderId, reason]);

  return null;
}
