/**
 * Client-safe constants, types and helpers for shipping & logistics.
 */

import type { ShipmentStatus } from "@/lib/supabase/database.types";

export const CARRIER_PROVIDERS = [
  "delhivery",
  "shiprocket",
  "blue_dart",
  "xpressbees",
  "india_post",
  "dtdc",
  "ekart",
  "amazon_shipping",
  "custom",
] as const;
export type CarrierProvider = (typeof CARRIER_PROVIDERS)[number];

export const CARRIER_PROVIDER_LABELS: Record<CarrierProvider, string> = {
  delhivery: "Delhivery",
  shiprocket: "Shiprocket",
  blue_dart: "Blue Dart",
  xpressbees: "Xpressbees",
  india_post: "India Post",
  dtdc: "DTDC",
  ekart: "Ekart",
  amazon_shipping: "Amazon Shipping",
  custom: "Custom",
};

export const NDR_REASONS = [
  "customer_unavailable",
  "wrong_address",
  "refused",
  "reschedule",
  "rto",
] as const;
export type NdrReason = (typeof NDR_REASONS)[number];

export const NDR_REASON_LABELS: Record<NdrReason, string> = {
  customer_unavailable: "Customer Unavailable",
  wrong_address: "Wrong Address",
  refused: "Refused",
  reschedule: "Reschedule",
  rto: "RTO",
};

export const NDR_STATUSES = ["open", "resolved", "rto"] as const;
export type NdrStatus = (typeof NDR_STATUSES)[number];

export const PICKUP_STATUSES = ["pending", "scheduled", "picked_up", "failed", "cancelled"] as const;
export type PickupStatus = (typeof PICKUP_STATUSES)[number];

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  picked_up: "Picked Up",
  failed: "Failed",
  cancelled: "Cancelled",
};

export interface ShippingDashboard {
  pendingShipments: number;
  readyToShip: number;
  todaysPickups: number;
  failedDeliveries: number;
  deliveredShipments: number;
  missingAwb: number;
  ndrCount: number;
  rtoCount: number;
}

export interface CarrierListItem {
  id: string;
  name: string;
  provider: CarrierProvider;
  sandbox: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface CarrierDetail extends CarrierListItem {
  hasApiKey: boolean;
  hasApiSecret: boolean;
  createdAt: string;
}

export interface ZoneListItem {
  id: string;
  name: string;
  country: string;
  state: string | null;
  city: string | null;
  postalFrom: string | null;
  postalTo: string | null;
  priority: number;
  isActive: boolean;
  updatedAt: string;
}

export interface RateListItem {
  id: string;
  zoneId: string;
  zoneName: string;
  name: string;
  weightMinGrams: number;
  weightMaxGrams: number | null;
  price: number;
  freeShippingThreshold: number | null;
  codCharge: number;
  isActive: boolean;
  updatedAt: string;
}

export interface ShipmentLogisticsItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  carrier: string | null;
  carrierId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: ShipmentStatus;
  warehouseName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
}

export interface TrackingEventItem {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  eventType: string;
  message: string | null;
  location: string | null;
  occurredAt: string;
}

export interface NdrListItem {
  id: string;
  shipmentId: string;
  orderNumber: string;
  trackingNumber: string | null;
  reason: NdrReason;
  status: NdrStatus;
  createdAt: string;
}

export interface PickupListItem {
  id: string;
  carrierName: string | null;
  warehouseName: string | null;
  pickupDate: string;
  status: PickupStatus;
  reference: string | null;
  createdAt: string;
}

export function maskCredential(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
}
