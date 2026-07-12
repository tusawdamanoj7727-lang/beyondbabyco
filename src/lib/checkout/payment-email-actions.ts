"use server";

import { onPaymentFailed } from "@/lib/email/events/orders";

/** Fire-and-forget payment failure notification — does not block checkout UI. */
export async function notifyPaymentFailedAction(orderId: string): Promise<void> {
  onPaymentFailed(orderId);
}
