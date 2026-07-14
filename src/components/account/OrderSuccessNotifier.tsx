"use client";

import { useEffect } from "react";

import { addNotification } from "@/lib/storefront/notifications";
import { trackOrderCompleted } from "@/lib/analytics/events";

export default function OrderSuccessNotifier({
  orderNumber,
  orderId,
  grandTotal,
  paymentMethod,
  itemCount,
}: {
  orderNumber: string;
  orderId: string;
  grandTotal: number;
  paymentMethod?: string;
  itemCount?: number;
}) {
  useEffect(() => {
    addNotification({
      type: "payment_success",
      priority: "high",
      title: "Order confirmed",
      message: `${orderNumber} has been placed successfully.`,
      href: `/account/orders/${orderId}`,
      icon: "credit-card",
    });
    trackOrderCompleted({
      transactionId: orderId,
      value: grandTotal,
      itemCount,
      paymentMethod,
    });
  }, [orderNumber, orderId, grandTotal, paymentMethod, itemCount]);

  return null;
}
