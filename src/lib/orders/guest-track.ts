import "server-only";

import { timingSafeEqual } from "node:crypto";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { issueStableInvoiceToken } from "@/lib/invoices/token";
import {
  ORDER_STATUS_LABELS,
  type AdminOrderStatus,
} from "@/lib/admin/order-types";
import {
  ORDER_NUMBER_REGEX,
  TRACK_LOOKUP_GENERIC_ERROR,
  type GuestTrackResult,
  type GuestTrackTimelineStep,
} from "@/lib/orders/guest-track-types";

export {
  ORDER_NUMBER_REGEX,
  TRACK_LOOKUP_GENERIC_ERROR,
  type GuestTrackResult,
  type GuestTrackTimelineStep,
} from "@/lib/orders/guest-track-types";

function normalizeOrderNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Constant-time string equality (length-aware via length prefix byte). */
export function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ba.length, bb.length, 1);
  const pa = Buffer.alloc(len + 1);
  const pb = Buffer.alloc(len + 1);
  pa[0] = Math.min(ba.length, 255);
  pb[0] = Math.min(bb.length, 255);
  ba.copy(pa, 1, 0, len);
  bb.copy(pb, 1, 0, len);
  return timingSafeEqual(pa, pb);
}

export function validateTrackOrderInput(input: {
  orderNumber?: string;
  email?: string;
}): { ok: true; orderNumber: string; email: string } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const orderNumber = normalizeOrderNumber(input.orderNumber ?? "");
  const email = normalizeEmail(input.email ?? "");

  if (!orderNumber) {
    fieldErrors.orderNumber = "Enter your order number.";
  } else if (!ORDER_NUMBER_REGEX.test(orderNumber)) {
    fieldErrors.orderNumber = "Order number should look like ORD-20260718-XXXXX.";
  }

  if (!email) {
    fieldErrors.email = "Enter the email used at checkout.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true, orderNumber, email };
}

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .map((p, i) => (i === 0 ? p : p.length <= 1 ? "*" : `${p[0]}${"*".repeat(Math.min(p.length - 1, 4))}`))
    .join(" ");
}

function maskLine1(line1: string): string {
  const t = line1.trim();
  if (t.length <= 6) return "***";
  return `${t.slice(0, 4)}***${t.slice(-2)}`;
}

function formatDateIn(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function paymentMethodLabel(method: string | null, provider: string | null): string | null {
  const m = (method ?? provider ?? "").toLowerCase();
  if (!m) return null;
  if (m === "cod") return "Cash on Delivery";
  if (m === "razorpay") return "Paid online (Razorpay)";
  return method ?? provider;
}

function delhiveryTrackingUrl(awb: string): string {
  return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
}

function buildTimeline(
  status: string,
  placedAt: string | null,
  shipmentStatus: string | null,
): GuestTrackTimelineStep[] {
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

  const steps: GuestTrackTimelineStep[] = [
    {
      key: "placed",
      label: "Order Placed",
      state: "complete",
      at: placedAt,
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
      at: null,
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
      at: null,
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
      at: null,
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
      at: null,
    },
  ];

  if (isCancelled) {
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      state: "terminal",
      at: null,
    });
  }
  if (isRefunded) {
    steps.push({
      key: "refunded",
      label: s === "returned" ? "Returned" : "Refunded",
      state: "terminal",
      at: null,
    });
  }

  return steps;
}

type OrderLookupRow = {
  id: string;
  order_number: string;
  status: string;
  placed_at: string | null;
  created_at: string;
  grand_total: number;
  currency: string;
  customers: { email: string | null; full_name: string | null } | null;
  order_items: { name: string; quantity: number; total: number }[] | null;
  payments: { method: string | null; provider: string | null; status: string | null }[] | null;
  shipping_addresses:
    | {
        full_name: string;
        line1: string;
        city: string;
        state: string;
        pincode: string;
      }[]
    | null;
  shipments:
    | {
        id: string;
        tracking_number: string | null;
        carrier: string | null;
        status: string | null;
        estimated_delivery: string | null;
      }[]
    | null;
};

/**
 * Secure guest order lookup — requires order_number + email.
 * Never returns a hit without email match. Generic miss message for enumeration resistance.
 */
export async function lookupGuestOrder(input: {
  orderNumber: string;
  email: string;
}): Promise<
  | { ok: true; order: GuestTrackResult }
  | { ok: false; code: "not_found" | "server_error"; error: string }
> {
  const supabase = createSupabaseServiceClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        placed_at,
        created_at,
        grand_total,
        currency,
        customers!inner ( email, full_name ),
        order_items ( name, quantity, total ),
        payments ( method, provider, status ),
        shipping_addresses ( full_name, line1, city, state, pincode ),
        shipments ( id, tracking_number, carrier, status, estimated_delivery )
      `,
      )
      .eq("order_number", input.orderNumber)
      .maybeSingle();

    if (error) {
      console.error("[guest-track] lookup query failed", error.message);
      return { ok: false, code: "server_error", error: "Something went wrong. Please try again." };
    }

    const row = data as OrderLookupRow | null;
    const storedEmail = normalizeEmail(row?.customers?.email ?? "");

    // Always run a comparison work factor even when the order is missing.
    const emailOk = safeEqualString(storedEmail || "\0".repeat(8), input.email || "\0".repeat(8));

    if (!row || !storedEmail || !emailOk) {
      return { ok: false, code: "not_found", error: TRACK_LOOKUP_GENERIC_ERROR };
    }

    const payment = row.payments?.[0] ?? null;
    const address = row.shipping_addresses?.[0] ?? null;
    const shipment = row.shipments?.[0] ?? null;
    const awb = shipment?.tracking_number?.trim() || null;
    const carrier = shipment?.carrier?.trim() || (awb ? "Delhivery" : null);
    const placedAt = row.placed_at ?? row.created_at;
    const status = row.status;
    const statusLabel =
      ORDER_STATUS_LABELS[status as AdminOrderStatus] ??
      status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const invoiceToken = issueStableInvoiceToken(row.id, placedAt);
    const invoiceBase = `/api/invoices/${row.id}?token=${encodeURIComponent(invoiceToken)}`;

    let latestShipmentUpdate: string | null = null;
    if (shipment?.id) {
      const { data: events } = await supabase
        .from("shipment_tracking")
        .select("message, status, event_time")
        .eq("shipment_id", shipment.id)
        .order("event_time", { ascending: false })
        .limit(1);
      const ev = events?.[0];
      if (ev) {
        latestShipmentUpdate = [ev.status, ev.message].filter(Boolean).join(" — ") || null;
      }
    }

    const order: GuestTrackResult = {
      orderNumber: row.order_number,
      status,
      statusLabel,
      orderDate: formatDateIn(placedAt),
      estimatedDelivery: shipment?.estimated_delivery
        ? formatDateIn(shipment.estimated_delivery)
        : "3–5 business days",
      paymentMethod: paymentMethodLabel(payment?.method ?? null, payment?.provider ?? null),
      grandTotal: Number(row.grand_total),
      currency: row.currency || "INR",
      items: (row.order_items ?? []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        lineTotal: Number(item.total),
      })),
      shippingAddress: address
        ? {
            nameMasked: maskName(address.full_name),
            line1Masked: maskLine1(address.line1),
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          }
        : null,
      trackingNumber: awb,
      courierName: carrier,
      trackingUrl: awb ? delhiveryTrackingUrl(awb) : null,
      shipmentStatus: shipment?.status ?? null,
      latestShipmentUpdate,
      timeline: buildTimeline(status, placedAt, shipment?.status ?? null),
      invoiceDownloadUrl: `${invoiceBase}&download=1`,
      invoicePrintUrl: invoiceBase,
      isCancelled: status === "cancelled",
      isRefunded: status === "refunded" || status === "returned",
    };

    return { ok: true, order };
  } catch (err) {
    console.error("[guest-track] unexpected error", err);
    return { ok: false, code: "server_error", error: "Something went wrong. Please try again." };
  }
}
