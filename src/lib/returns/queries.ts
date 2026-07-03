import "server-only";

import {
  getReturnDetail,
  getReturnTimeline,
  listReturns,
  type ReturnListParams,
} from "@/lib/admin/returns";
import type {
  RefundStatus,
  ReturnDetail,
  ReturnListItem,
  ReturnReason,
  ReturnStatus,
  ReturnTimelineEvent,
} from "@/lib/admin/return-types";

export type {
  ReturnDetail,
  ReturnListItem,
  ReturnTimelineEvent,
  ReturnStatus,
  ReturnReason,
  RefundStatus,
};

export interface PublicReturnSummary {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  reason: ReturnReason;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  createdAt: string;
}

export async function getReturns(opts?: {
  customerId?: string;
  status?: ReturnStatus;
  limit?: number;
}): Promise<PublicReturnSummary[]> {
  const result = await listReturns({
    customerId: opts?.customerId,
    status: opts?.status,
    perPage: opts?.limit ?? 50,
    page: 1,
  });
  return result.rows.map((r) => ({
    id: r.id,
    rmaNumber: r.rmaNumber,
    orderId: r.orderId,
    orderNumber: r.orderNumber,
    customerName: r.customerName,
    itemCount: r.itemCount,
    reason: r.reason,
    status: r.status,
    refundStatus: r.refundStatus,
    createdAt: r.createdAt,
  }));
}

export async function getReturn(id: string): Promise<ReturnDetail | null> {
  return getReturnDetail(id);
}

export { getReturnTimeline };

export async function getReturnsPaginated(params: ReturnListParams) {
  return listReturns(params);
}
