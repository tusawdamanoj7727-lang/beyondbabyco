/** Shared guest order tracking types & validators (safe for client + server). */

/** ORD-YYYYMMDD-XXXXX (5 alphanumeric suffix). */
export const ORDER_NUMBER_REGEX = /^ORD-\d{8}-[A-Z0-9]{5}$/i;

export const TRACK_LOOKUP_GENERIC_ERROR =
  "We could not find an order matching those details. Check your order number and email, then try again.";

export type GuestTrackTimelineStep = {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "terminal";
  at: string | null;
};

export type GuestTrackResult = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  orderDate: string;
  estimatedDelivery: string | null;
  paymentMethod: string | null;
  grandTotal: number;
  currency: string;
  items: {
    name: string;
    quantity: number;
    lineTotal: number;
  }[];
  shippingAddress: {
    nameMasked: string;
    line1Masked: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  trackingNumber: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  shipmentStatus: string | null;
  latestShipmentUpdate: string | null;
  timeline: GuestTrackTimelineStep[];
  invoiceDownloadUrl: string;
  invoicePrintUrl: string;
  isCancelled: boolean;
  isRefunded: boolean;
};
