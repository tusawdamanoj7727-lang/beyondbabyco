import type { GatewayProvider } from "../payment-types";
import { razorpayGatewayAdapter } from "./razorpay";

export interface GatewayAdapterResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CreateOrderParams {
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CapturePaymentParams {
  gatewayTxnId: string;
  amount: number;
  currency: string;
}

export interface RefundPaymentParams {
  gatewayTxnId: string;
  amount: number;
  currency: string;
  reason?: string | null;
}

export interface WebhookVerifyParams {
  payload: string | Record<string, unknown>;
  signature: string | null;
  secret?: string | null;
  /** Raw request body — required for Razorpay HMAC verification */
  rawBody?: string;
}

export interface FetchPaymentParams {
  gatewayTxnId: string;
}

export interface SyncSettlementParams {
  settlementDate: string;
}

export interface PaymentGatewayAdapter {
  readonly provider: GatewayProvider;
  createOrder(params: CreateOrderParams): Promise<GatewayAdapterResult<{ orderId: string; gatewayTxnId: string }>>;
  capturePayment(params: CapturePaymentParams): Promise<GatewayAdapterResult<{ captured: boolean }>>;
  refundPayment(params: RefundPaymentParams): Promise<GatewayAdapterResult<{ refundId: string }>>;
  verifyWebhook(params: WebhookVerifyParams): Promise<GatewayAdapterResult<{ valid: boolean; eventType?: string }>>;
  verifySignature(params: WebhookVerifyParams): Promise<GatewayAdapterResult<{ valid: boolean }>>;
  fetchPayment(params: FetchPaymentParams): Promise<GatewayAdapterResult<{ status: string; amount: number }>>;
  fetchRefund(refundId: string): Promise<GatewayAdapterResult<{ status: string; amount: number }>>;
  syncSettlement(params: SyncSettlementParams): Promise<GatewayAdapterResult<{ expected: number; received: number }>>;
  healthCheck(): Promise<GatewayAdapterResult<{ ok: boolean }>>;
}

const NOT_CONNECTED = "Gateway not connected";

function notConnected<T>(): GatewayAdapterResult<T> {
  return { success: false, message: NOT_CONNECTED };
}

export function createPlaceholderGatewayAdapter(provider: GatewayProvider): PaymentGatewayAdapter {
  return {
    provider,
    async createOrder() {
      // TODO: Insert real API call for ${provider}.createOrder()
      return notConnected();
    },
    async capturePayment() {
      // TODO: Insert real API call for ${provider}.capturePayment()
      return notConnected();
    },
    async refundPayment() {
      // TODO: Insert real API call for ${provider}.refundPayment()
      return notConnected();
    },
    async verifyWebhook() {
      // TODO: Insert real webhook verification for ${provider}
      return notConnected();
    },
    async verifySignature() {
      // TODO: Insert real signature verification for ${provider}
      return notConnected();
    },
    async fetchPayment() {
      // TODO: Insert real API call for ${provider}.fetchPayment()
      return notConnected();
    },
    async fetchRefund() {
      // TODO: Insert real API call for ${provider}.fetchRefund()
      return notConnected();
    },
    async syncSettlement() {
      // TODO: Insert real API call for ${provider}.syncSettlement()
      return notConnected();
    },
    async healthCheck() {
      // TODO: Insert real health check for ${provider}
      return notConnected();
    },
  };
}

export const GATEWAY_ADAPTERS: Record<GatewayProvider, PaymentGatewayAdapter> = {
  razorpay: razorpayGatewayAdapter,
  cashfree: createPlaceholderGatewayAdapter("cashfree"),
  phonepe: createPlaceholderGatewayAdapter("phonepe"),
  payu: createPlaceholderGatewayAdapter("payu"),
  stripe: createPlaceholderGatewayAdapter("stripe"),
  paypal: createPlaceholderGatewayAdapter("paypal"),
  custom: createPlaceholderGatewayAdapter("custom"),
};

export function getPaymentGatewayAdapter(provider: GatewayProvider): PaymentGatewayAdapter {
  return GATEWAY_ADAPTERS[provider] ?? GATEWAY_ADAPTERS.custom;
}

// Named exports for spec compliance
export const RazorpayAdapter = GATEWAY_ADAPTERS.razorpay;
export const CashfreeAdapter = GATEWAY_ADAPTERS.cashfree;
export const PhonePeAdapter = GATEWAY_ADAPTERS.phonepe;
export const PayUAdapter = GATEWAY_ADAPTERS.payu;
export const StripeAdapter = GATEWAY_ADAPTERS.stripe;
export const PaypalAdapter = GATEWAY_ADAPTERS.paypal;
