/** Status-derived order timeline from existing order/shipment fields (no fabricated events). */

export type OrderStatusTimelineStep = {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "terminal";
  at: string | null;
};

/**
 * Build a customer-facing lifecycle timeline from the order's current status
 * and known timestamps (placedAt / event map). Unreached steps have no date.
 */
export function buildOrderStatusTimeline(
  status: string,
  placedAt: string | null,
  shipmentStatus: string | null,
  eventTimes?: Partial<Record<string, string | null>>,
): OrderStatusTimelineStep[] {
  const s = status.toLowerCase();
  const ship = (shipmentStatus ?? "").toLowerCase();

  const isCancelled = s === "cancelled";
  const isRefunded = s === "refunded" || s === "returned";

  const reachedConfirmed = [
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "completed",
  ].includes(s);
  const reachedPacked = ["packed", "processing", "shipped", "delivered", "completed"].includes(s);
  const reachedShipped =
    ["shipped", "delivered", "completed"].includes(s) ||
    ["in_transit", "out_for_delivery", "delivered", "label_created"].includes(ship);
  const reachedDelivered =
    ["delivered", "completed"].includes(s) || ship === "delivered";

  const atFor = (key: string, fallback: string | null = null) =>
    eventTimes?.[key] ?? fallback;

  const steps: OrderStatusTimelineStep[] = [
    {
      key: "placed",
      label: "Order Placed",
      state: "complete",
      at: atFor("placed", placedAt),
    },
    {
      key: "confirmed",
      label: "Confirmed",
      state: isCancelled || isRefunded
        ? reachedConfirmed
          ? "complete"
          : "upcoming"
        : reachedConfirmed
          ? reachedPacked
            ? "complete"
            : "current"
          : "upcoming",
      at: atFor("confirmed"),
    },
    {
      key: "packed",
      label: "Packed",
      state: isCancelled || isRefunded
        ? reachedPacked
          ? "complete"
          : "upcoming"
        : reachedPacked
          ? reachedShipped
            ? "complete"
            : "current"
          : "upcoming",
      at: atFor("packed"),
    },
    {
      key: "shipped",
      label: "Shipped",
      state: isCancelled || isRefunded
        ? reachedShipped
          ? "complete"
          : "upcoming"
        : reachedShipped
          ? reachedDelivered
            ? "complete"
            : "current"
          : "upcoming",
      at: atFor("shipped"),
    },
    {
      key: "delivered",
      label: "Delivered",
      state: isCancelled || isRefunded
        ? reachedDelivered
          ? "complete"
          : "upcoming"
        : reachedDelivered
          ? "complete"
          : "upcoming",
      at: atFor("delivered"),
    },
  ];

  if (isCancelled) {
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      state: "terminal",
      at: atFor("cancelled"),
    });
  }
  if (isRefunded) {
    steps.push({
      key: "refunded",
      label: "Refunded",
      state: "terminal",
      at: atFor("refunded"),
    });
  }

  return steps;
}

/** Map payment row status + method to customer-facing labels. */
export function customerPaymentStatusLabel(
  paymentStatus: string | null | undefined,
  paymentMethod: string | null | undefined,
): "Pending" | "COD" | "Paid" | "Failed" | "Refunded" {
  const s = (paymentStatus ?? "pending").toLowerCase();
  const m = (paymentMethod ?? "").toLowerCase();

  if (s === "refunded" || s === "partially_refunded") return "Refunded";
  if (s === "failed") return "Failed";
  if (s === "paid" || s === "captured" || s === "authorized") return "Paid";
  if (m === "cod" || m === "cash_on_delivery") return "COD";
  return "Pending";
}

/** Map order_events.type values onto timeline step keys when present. */
export function eventTimesFromOrderEvents(
  events: { type: string; createdAt: string }[],
): Partial<Record<string, string | null>> {
  const map: Partial<Record<string, string | null>> = {};
  for (const e of events) {
    const t = e.type.toLowerCase();
    if (t.includes("place") || t === "order_created" || t === "created") {
      map.placed ??= e.createdAt;
    } else if (t.includes("confirm")) {
      map.confirmed ??= e.createdAt;
    } else if (t.includes("pack")) {
      map.packed ??= e.createdAt;
    } else if (t.includes("ship")) {
      map.shipped ??= e.createdAt;
    } else if (t.includes("deliver")) {
      map.delivered ??= e.createdAt;
    } else if (t.includes("cancel")) {
      map.cancelled ??= e.createdAt;
    } else if (t.includes("refund")) {
      map.refunded ??= e.createdAt;
    }
  }
  return map;
}
