"use client";

import { useEffect } from "react";

import { addNotification } from "@/lib/storefront/notifications";

export default function OrderSuccessNotifier({
  orderNumber,
  orderId,
}: {
  orderNumber: string;
  orderId: string;
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
  }, [orderNumber, orderId]);

  return null;
}
