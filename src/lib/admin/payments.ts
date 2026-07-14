import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/database.types";
import type {
  GatewayDetail,
  GatewayListItem,
  GatewayProvider,
  PaymentDashboard,
  PaymentDetail,
  PaymentListItem,
  PaymentSortColumn,
  ReconciliationRow,
  SettlementRow,
  SettlementSummary,
  SettlementStatus,
} from "./payment-types";

export interface PaymentListParams {
  search?: string;
  status?: PaymentStatus | "all";
  gatewayId?: string;
  method?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: PaymentSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface PaymentListResult {
  rows: PaymentListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getPaymentDashboard(): Promise<PaymentDashboard> {
  const supabase = await createSupabaseServerClient();
  const todayStart = startOfTodayIso();

  const [{ data: payments }, { data: refunds }, { data: settlements }] = await Promise.all([
    supabase.from("payments").select("id, amount, status, created_at"),
    supabase.from("order_refunds").select("amount, created_at"),
    supabase.from("settlements").select("difference, status"),
  ]);

  const todayPayments = (payments ?? []).filter((p) => p.created_at >= todayStart);
  const captured = (payments ?? []).filter((p) => ["paid", "captured"].includes(p.status));
  const pending = (payments ?? []).filter((p) => p.status === "pending" || p.status === "authorized");
  const failed = (payments ?? []).filter((p) => p.status === "failed");
  const todayRevenue = todayPayments
    .filter((p) => ["paid", "captured", "authorized"].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0);
  const refundAmount = (refunds ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const settlementDifference = (settlements ?? []).reduce((s, st) => s + Number(st.difference ?? 0), 0);

  return {
    todaysRevenue: todayRevenue,
    capturedPayments: captured.length,
    pendingPayments: pending.length,
    failedPayments: failed.length,
    refundAmount,
    settlementDifference,
  };
}

export async function listPayments(params: PaymentListParams): Promise<PaymentListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "created_at";
  const ascending = params.dir === "asc";

  let query = supabase.from("payments").select("*", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.gatewayId) query = query.eq("gateway_id", params.gatewayId);
  if (params.method) query = query.eq("method", params.method);
  if (params.customerId) query = query.eq("customer_id", params.customerId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const dbSort = ["created_at", "amount", "status"].includes(sort) ? sort : "created_at";
  query = query.order(dbSort, { ascending });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const orderIds = [...new Set((data ?? []).map((p) => p.order_id))];
  const gatewayIds = [...new Set((data ?? []).map((p) => p.gateway_id).filter(Boolean))] as string[];
  const customerIds = [...new Set((data ?? []).map((p) => p.customer_id).filter(Boolean))] as string[];

  const [{ data: orders }, { data: gateways }, { data: customers }] = await Promise.all([
    orderIds.length ? supabase.from("orders").select("id, order_number, customer_id").in("id", orderIds) : Promise.resolve({ data: [] }),
    gatewayIds.length ? supabase.from("payment_gateways").select("id, display_name").in("id", gatewayIds) : Promise.resolve({ data: [] }),
    customerIds.length ? supabase.from("customers").select("id, full_name, email").in("id", customerIds) : Promise.resolve({ data: [] }),
  ]);

  const oMap = new Map((orders ?? []).map((o) => [o.id, o]));
  const gMap = new Map((gateways ?? []).map((g) => [g.id, g.display_name]));
  const cMap = new Map((customers ?? []).map((c) => [c.id, c]));

  let rows: PaymentListItem[] = (data ?? []).map((p) => {
    const order = oMap.get(p.order_id);
    const custId = p.customer_id ?? order?.customer_id;
    const customer = custId ? cMap.get(custId) : undefined;
    return {
      id: p.id,
      paymentRef: p.payment_ref,
      orderId: p.order_id,
      orderNumber: order?.order_number ?? "—",
      customerId: custId ?? null,
      customerName: customer?.full_name ?? customer?.email ?? "Guest",
      gatewayName: p.gateway_id ? gMap.get(p.gateway_id) ?? null : p.provider,
      gatewayId: p.gateway_id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      gatewayTxnId: p.gateway_txn_id,
      createdAt: p.created_at,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        (r.paymentRef?.toLowerCase().includes(q) ?? false) ||
        (r.gatewayTxnId?.toLowerCase().includes(q) ?? false) ||
        r.customerName.toLowerCase().includes(q),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getPaymentDetail(id: string): Promise<PaymentDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (!p) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id")
    .eq("id", p.order_id)
    .maybeSingle();

  const customerId = p.customer_id ?? order?.customer_id ?? null;

  const [
    { data: gateway },
    { data: customer },
    { data: transactions },
    { data: orderRefunds },
    { data: webhooks },
    { data: logs },
    { data: reconciliation },
    { data: settlements },
  ] = await Promise.all([
    p.gateway_id ? supabase.from("payment_gateways").select("*").eq("id", p.gateway_id).maybeSingle() : Promise.resolve({ data: null }),
    customerId
      ? supabase.from("customers").select("id, full_name, email").eq("id", customerId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("payment_transactions").select("*").eq("payment_id", id).order("created_at", { ascending: false }),
    supabase.from("order_refunds").select("*").eq("order_id", p.order_id).order("created_at", { ascending: false }),
    supabase.from("payment_webhooks").select("id, event_type, processed, processed_at, error, created_at").eq("payment_id", id).order("created_at", { ascending: false }),
    supabase.from("payment_logs").select("*").eq("payment_id", id).order("created_at", { ascending: false }),
    supabase.from("payment_reconciliation").select("*").eq("payment_id", id).order("created_at", { ascending: false }),
    p.gateway_id
      ? supabase.from("settlements").select("*").eq("gateway_id", p.gateway_id).order("settlement_date", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    id: p.id,
    paymentRef: p.payment_ref,
    orderId: p.order_id,
    orderNumber: order?.order_number ?? "—",
    customerId: customer?.id ?? p.customer_id,
    customerName: customer?.full_name ?? customer?.email ?? "Guest",
    customerEmail: customer?.email ?? null,
    gatewayId: p.gateway_id,
    gatewayName: gateway?.display_name ?? p.provider,
    gatewayProvider: (gateway?.provider as GatewayProvider) ?? null,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    provider: p.provider,
    status: p.status,
    gatewayTxnId: p.gateway_txn_id,
    fees: Number(p.fees ?? 0),
    tax: Number(p.tax ?? 0),
    failedReason: p.failed_reason,
    capturedAt: p.captured_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    transactions: (transactions ?? []).map((t) => ({
      id: t.id,
      txnRef: t.txn_ref,
      gatewayTxnId: t.gateway_txn_id,
      reference: t.reference,
      amount: t.amount,
      fees: Number(t.fees ?? 0),
      tax: Number(t.tax ?? 0),
      status: t.status,
      raw: (t.raw as Record<string, unknown>) ?? null,
      createdAt: t.created_at,
    })),
    refunds: (orderRefunds ?? []).map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      gatewayRef: null,
      notes: r.notes,
      createdAt: r.created_at,
    })),
    webhooks: (webhooks ?? []).map((w) => ({
      id: w.id,
      eventType: w.event_type,
      processed: w.processed,
      processedAt: w.processed_at,
      error: w.error,
      createdAt: w.created_at,
    })),
    settlements: (settlements ?? []).map(mapSettlement),
    reconciliation: (reconciliation ?? []).map(mapReconciliation),
    logs: (logs ?? []).map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      metadata: (l.metadata as Record<string, unknown>) ?? {},
      createdAt: l.created_at,
    })),
  };
}

function mapSettlement(s: {
  id: string;
  settlement_date: string;
  expected_amount: number;
  received_amount: number;
  difference: number;
  status: string;
  bank_reference: string | null;
  synced_at: string | null;
}): SettlementRow {
  return {
    id: s.id,
    settlementDate: s.settlement_date,
    expectedAmount: s.expected_amount,
    receivedAmount: s.received_amount,
    difference: s.difference,
    status: s.status as SettlementStatus,
    bankReference: s.bank_reference,
    syncedAt: s.synced_at,
  };
}

function mapReconciliation(r: {
  id: string;
  reconciliation_date: string;
  expected_amount: number;
  actual_amount: number;
  status: string;
  notes: string | null;
}): ReconciliationRow {
  return {
    id: r.id,
    reconciliationDate: r.reconciliation_date,
    expectedAmount: r.expected_amount,
    actualAmount: r.actual_amount,
    status: r.status as ReconciliationRow["status"],
    notes: r.notes,
  };
}

export async function listPaymentGateways(): Promise<GatewayListItem[]> {
  // Ensure env-backed production Razorpay appears in admin when Vercel keys are set.
  try {
    const { ensureEnvBackedRazorpayGateway } = await import("@/lib/checkout/gateways");
    await ensureEnvBackedRazorpayGateway();
  } catch {
    /* non-blocking — list still returns whatever rows exist */
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payment_gateways")
    .select("id, display_name, provider, sandbox, currency, is_enabled, priority, lifecycle_status, updated_at")
    .is("deleted_at", null)
    .order("priority", { ascending: false });
  return (data ?? []).map((g) => ({
    id: g.id,
    displayName: g.display_name,
    provider: g.provider as GatewayProvider,
    sandbox: g.sandbox,
    currency: g.currency,
    isEnabled: g.is_enabled,
    priority: g.priority,
    lifecycleStatus: g.lifecycle_status,
    updatedAt: g.updated_at,
  }));
}

export async function getPaymentGatewayDetail(id: string): Promise<GatewayDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: g } = await supabase.from("payment_gateways").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!g) return null;
  return {
    id: g.id,
    displayName: g.display_name,
    provider: g.provider as GatewayProvider,
    sandbox: g.sandbox,
    currency: g.currency,
    isEnabled: g.is_enabled,
    priority: g.priority,
    lifecycleStatus: g.lifecycle_status,
    webhookUrl: g.webhook_url,
    hasApiKey: !!g.api_key_encrypted,
    hasApiSecret: !!g.api_secret_encrypted,
    hasWebhookSecret: !!g.webhook_secret_encrypted,
    updatedAt: g.updated_at,
    createdAt: g.created_at,
  };
}

export async function getSettlementSummary(gatewayId?: string): Promise<SettlementSummary> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("settlements").select("*").order("settlement_date", { ascending: false }).limit(30);
  if (gatewayId) query = query.eq("gateway_id", gatewayId);
  const { data } = await query;

  const rows = (data ?? []).map(mapSettlement);
  return {
    totalExpected: rows.reduce((s, r) => s + r.expectedAmount, 0),
    totalReceived: rows.reduce((s, r) => s + r.receivedAmount, 0),
    totalDifference: rows.reduce((s, r) => s + r.difference, 0),
    mismatchCount: rows.filter((r) => r.status === "mismatch").length,
    recent: rows,
  };
}

export async function getPaymentFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: gateways }, { data: customers }] = await Promise.all([
    supabase.from("payment_gateways").select("id, display_name, provider").is("deleted_at", null).order("display_name"),
    supabase.from("customers").select("id, full_name, email").is("deleted_at", null).order("full_name").limit(200),
  ]);
  return {
    gateways: gateways ?? [],
    customers: (customers ?? []).map((c) => ({ id: c.id, name: c.full_name ?? c.email ?? c.id.slice(0, 8) })),
  };
}

export interface AuditLogRow {
  id: string;
  action: string;
  tableName: string;
  recordId: string | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

export async function getPaymentAuditLogs(paymentId: string): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, record_id, new_data, created_at")
    .eq("record_id", paymentId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    tableName: a.table_name,
    recordId: a.record_id,
    newData: a.new_data as Record<string, unknown> | null,
    createdAt: a.created_at,
  }));
}

export async function runReconciliationForPayment(paymentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("payments").select("id, order_id, amount").eq("id", paymentId).maybeSingle();
  if (!p) return null;

  const { data: order } = await supabase.from("orders").select("grand_total").eq("id", p.order_id).maybeSingle();
  const expected = order?.grand_total ?? p.amount;
  const actual = p.amount;
  const status = Math.abs(Number(expected) - Number(actual)) < 0.01 ? "matched" : "mismatch";

  const { data: rec } = await supabase
    .from("payment_reconciliation")
    .insert({
      payment_id: paymentId,
      order_id: p.order_id,
      expected_amount: expected,
      actual_amount: actual,
      status,
      notes: status === "mismatch" ? "Payment amount differs from order total" : null,
    })
    .select("id")
    .single();

  return rec?.id ?? null;
}
