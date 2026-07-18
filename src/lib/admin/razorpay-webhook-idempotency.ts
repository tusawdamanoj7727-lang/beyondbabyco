import "server-only";

/** Logged only after payment capture, inventory commit, and email dispatch start. */
export const RAZORPAY_CAPTURE_COMPLETED_LOG = "Razorpay webhook capture completed";

/** Received + signature verified; not used for duplicate suppression. */
export const RAZORPAY_WEBHOOK_RECEIVED_LOG = "Webhook event received";

/** Events that mark payment paid / run capture side-effects (inventory, emails). */
export const RAZORPAY_CAPTURE_EVENTS = new Set(["payment.captured", "order.paid"]);

/** Only this event may create a Delhivery shipment (exactly once). */
export const RAZORPAY_SHIPMENT_EVENTS = new Set(["order.paid"]);

export function isRazorpayCaptureEvent(eventType: string): boolean {
  return RAZORPAY_CAPTURE_EVENTS.has(eventType);
}

export function isRazorpayShipmentEvent(eventType: string): boolean {
  return RAZORPAY_SHIPMENT_EVENTS.has(eventType);
}
