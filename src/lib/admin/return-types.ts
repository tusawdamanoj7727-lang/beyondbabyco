/**
 * Client-safe constants, types and helpers for the returns / RMA module.
 */

export const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "received",
  "inspection",
  "refund_approved",
  "refunded",
  "closed",
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  pickup_scheduled: "Pickup Scheduled",
  received: "Received",
  inspection: "Inspection",
  refund_approved: "Refund Approved",
  refunded: "Refunded",
  closed: "Closed",
};

export const RETURN_REASONS = [
  "damaged",
  "wrong_item",
  "missing_item",
  "quality_issue",
  "expired",
  "customer_changed_mind",
  "other",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  damaged: "Damaged",
  wrong_item: "Wrong Item",
  missing_item: "Missing Item",
  quality_issue: "Quality Issue",
  expired: "Expired",
  customer_changed_mind: "Customer Changed Mind",
  other: "Other",
};

export const REFUND_STATUSES = [
  "pending",
  "partial",
  "full",
  "store_credit",
  "gift_card",
  "refunded",
  "none",
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "Pending",
  partial: "Partial",
  full: "Full",
  store_credit: "Store Credit",
  gift_card: "Gift Card",
  refunded: "Refunded",
  none: "None",
};

export const REFUND_TYPES = ["partial", "full", "store_credit", "gift_card"] as const;
export type RefundType = (typeof REFUND_TYPES)[number];

export const RESTOCK_DECISIONS = ["good", "damaged", "destroy", "vendor_return"] as const;
export type RestockDecision = (typeof RESTOCK_DECISIONS)[number];

export const RESTOCK_LABELS: Record<RestockDecision, string> = {
  good: "Good — Restock",
  damaged: "Damaged",
  destroy: "Destroy",
  vendor_return: "Vendor Return",
};

export const DAMAGE_LEVELS = ["none", "minor", "major", "total"] as const;
export type DamageLevel = (typeof DAMAGE_LEVELS)[number];

export const RETURN_SORTABLE_COLUMNS = ["created_at", "rma_number", "status", "reason"] as const;
export type ReturnSortColumn = (typeof RETURN_SORTABLE_COLUMNS)[number];

export interface ReturnListItem {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  itemCount: number;
  reason: ReturnReason;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  warehouseName: string | null;
  warehouseId: string | null;
  createdAt: string;
}

export interface ReturnDashboard {
  pendingReturns: number;
  awaitingInspection: number;
  refundQueue: number;
  completedReturns: number;
  returnRate: number;
  refundsPending: number;
  refundsApproved: number;
  refundsRejected: number;
  refundsCompleted: number;
}

export interface ReturnItemRow {
  id: string;
  orderItemId: string | null;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  condition: string | null;
  restockDecision: RestockDecision | null;
  damageLevel: DamageLevel | null;
  inspectionPhotos: string[];
  inspectorNotes: string | null;
  restocked: boolean;
}

export interface ReturnTimelineEvent {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  userName: string | null;
  createdAt: string;
}

export interface ReturnDetail {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  status: ReturnStatus;
  reason: ReturnReason;
  refundStatus: RefundStatus;
  refundType: RefundType | null;
  refundAmount: number;
  inspectionNotes: string | null;
  inspectorName: string | null;
  internalNotes: string | null;
  restockCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  items: ReturnItemRow[];
  payment: { id: string; status: string; amount: number } | null;
  shipment: { id: string; trackingNumber: string | null; status: string } | null;
}

export function generateRmaNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RMA-${y}${m}${day}-${rand}`;
}
