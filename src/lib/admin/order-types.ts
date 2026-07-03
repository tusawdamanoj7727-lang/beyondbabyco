/**
 * Client-safe constants, types and helpers for the orders module.
 */

import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/lib/supabase/database.types";

export const ORDER_STATUSES = [
  "draft",
  "pending",
  "confirmed",
  "packed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "returned",
  "refunded",
] as const;

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  processing: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  authorized: "Pending",
  captured: "Paid",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  voided: "Voided",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  label_created: "Label Created",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

export const ORDER_SORTABLE_COLUMNS = ["order_number", "grand_total", "created_at", "status"] as const;
export type OrderSortColumn = (typeof ORDER_SORTABLE_COLUMNS)[number];

export type DocumentType = "invoice" | "packing_slip" | "shipping_label";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string | null;
  itemCount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shipmentStatus: ShipmentStatus | null;
  warehouseName: string | null;
  warehouseId: string | null;
  total: number;
  currency: string;
  createdAt: string;
}

export interface OrderDashboard {
  todayOrders: number;
  pending: number;
  packed: number;
  shipped: number;
  returns: number;
  revenue: number;
  averageOrderValue: number;
}

export interface OrderTimelineEvent {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  userName: string | null;
  createdAt: string;
}

export interface OrderItemRow {
  id: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  taxRate: number;
  total: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface OrderRefundRow {
  id: string;
  amount: number;
  reason: string | null;
  notes: string | null;
  status: PaymentStatus;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  notes: string | null;
  internalNotes: string | null;
  cancelReason: string | null;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRow[];
  shippingAddress: OrderAddress | null;
  payment: {
    id: string;
    status: PaymentStatus;
    amount: number;
    method: string | null;
    provider: string | null;
  } | null;
  shipment: {
    id: string;
    status: ShipmentStatus;
    trackingNumber: string | null;
    carrier: string | null;
    labelUrl: string | null;
    pickupStatus: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    estimatedDelivery: string | null;
  } | null;
  refunds: OrderRefundRow[];
}

export interface CourierLogRow {
  id: string;
  action: string;
  success: boolean;
  errorMessage: string | null;
  statusCode: number | null;
  createdAt: string;
}

export interface ShipmentListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  warehouseName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
}

export const RESERVATION_STATUSES = ["confirmed", "packed", "processing"] as const;
export const FULFILLMENT_STATUSES = ["shipped", "delivered", "completed"] as const;
