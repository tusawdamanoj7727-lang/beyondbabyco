import "server-only";

import {
  getPaymentDetail,
  getPaymentGatewayDetail,
  getSettlementSummary,
  listPaymentGateways,
  listPayments,
} from "@/lib/admin/payments";

export type {
  PaymentDetail,
  PaymentListItem,
  GatewayListItem,
  GatewayDetail,
  SettlementSummary,
} from "@/lib/admin/payment-types";

export async function getPayments(opts?: { limit?: number; status?: string }) {
  const result = await listPayments({
    status: (opts?.status as Parameters<typeof listPayments>[0]["status"]) ?? "all",
    perPage: opts?.limit ?? 50,
    page: 1,
  });
  return result.rows;
}

export async function getPayment(id: string) {
  return getPaymentDetail(id);
}

export async function getPaymentGateways() {
  return listPaymentGateways();
}

export { getSettlementSummary };

export async function getPaymentGateway(id: string) {
  return getPaymentGatewayDetail(id);
}
