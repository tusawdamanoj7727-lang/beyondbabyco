/**
 * Client-safe constants, types and helpers for payments & gateways.
 */

import type { PaymentStatus } from "@/lib/supabase/database.types";

export const GATEWAY_PROVIDERS = [
  "razorpay",
  "cashfree",
  "phonepe",
  "payu",
  "stripe",
  "paypal",
  "custom",
] as const;
export type GatewayProvider = (typeof GATEWAY_PROVIDERS)[number];

export const GATEWAY_PROVIDER_LABELS: Record<GatewayProvider, string> = {
  razorpay: "Razorpay",
  cashfree: "Cashfree",
  phonepe: "PhonePe PG",
  payu: "PayU",
  stripe: "Stripe",
  paypal: "PayPal",
  custom: "Custom",
};

/** Admin-facing payment statuses (maps DB payment_status + paid → Captured) */
export const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "captured",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
  "voided",
] as const;
export type AdminPaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  captured: "Captured",
  paid: "Captured",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  voided: "Voided",
};

export const SETTLEMENT_STATUSES = ["pending", "matched", "mismatch", "synced"] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const RECONCILIATION_STATUSES = ["pending", "matched", "mismatch"] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export const PAYMENT_SORTABLE_COLUMNS = ["created_at", "amount", "status"] as const;
export type PaymentSortColumn = (typeof PAYMENT_SORTABLE_COLUMNS)[number];

export interface PaymentDashboard {
  todaysRevenue: number;
  capturedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundAmount: number;
  settlementDifference: number;
}

export interface PaymentListItem {
  id: string;
  paymentRef: string | null;
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  gatewayName: string | null;
  gatewayId: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  gatewayTxnId: string | null;
  createdAt: string;
}

export interface PaymentTransactionRow {
  id: string;
  txnRef: string | null;
  gatewayTxnId: string | null;
  reference: string | null;
  amount: number;
  fees: number;
  tax: number;
  status: PaymentStatus;
  raw: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentRefundRow {
  id: string;
  amount: number;
  reason: string | null;
  status: PaymentStatus;
  gatewayRef: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentWebhookRow {
  id: string;
  eventType: string;
  processed: boolean;
  processedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface PaymentLogRow {
  id: string;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SettlementRow {
  id: string;
  settlementDate: string;
  expectedAmount: number;
  receivedAmount: number;
  difference: number;
  status: SettlementStatus;
  bankReference: string | null;
  syncedAt: string | null;
}

export interface ReconciliationRow {
  id: string;
  reconciliationDate: string;
  expectedAmount: number;
  actualAmount: number;
  status: ReconciliationStatus;
  notes: string | null;
}

export interface PaymentDetail {
  id: string;
  paymentRef: string | null;
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  gatewayId: string | null;
  gatewayName: string | null;
  gatewayProvider: GatewayProvider | null;
  amount: number;
  currency: string;
  method: string | null;
  provider: string | null;
  status: PaymentStatus;
  gatewayTxnId: string | null;
  fees: number;
  tax: number;
  failedReason: string | null;
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: PaymentTransactionRow[];
  refunds: PaymentRefundRow[];
  webhooks: PaymentWebhookRow[];
  settlements: SettlementRow[];
  reconciliation: ReconciliationRow[];
  logs: PaymentLogRow[];
}

export interface GatewayListItem {
  id: string;
  displayName: string;
  provider: GatewayProvider;
  sandbox: boolean;
  currency: string;
  isEnabled: boolean;
  priority: number;
  lifecycleStatus: string;
  updatedAt: string;
}

export interface GatewayDetail extends GatewayListItem {
  webhookUrl: string | null;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasWebhookSecret: boolean;
  createdAt: string;
}

export interface SettlementSummary {
  totalExpected: number;
  totalReceived: number;
  totalDifference: number;
  mismatchCount: number;
  recent: SettlementRow[];
}

export function displayPaymentStatus(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status as AdminPaymentStatus] ?? status;
}

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
