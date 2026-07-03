"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Database, Json, PaymentStatus } from "@/lib/supabase/database.types";
import { getPaymentGatewayAdapter } from "./gateway-adapters";
import { replayWebhook } from "./payment-engine";
import {
  bulkGatewayIdsSchema,
  gatewayInputSchema,
  manualCaptureSchema,
  manualRefundSchema,
  syncSettlementSchema,
} from "./payment-schema";
import type { GatewayProvider } from "./payment-types";
import { runReconciliationForPayment } from "./payments";

export interface PaymentActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function guard() {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);
}

function revalidate(id?: string) {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/payment-gateways");
  if (id) {
    revalidatePath(`/admin/payments/${id}`);
    revalidatePath(`/admin/payment-gateways/${id}`);
  }
}

function enc(value: string | null | undefined) {
  if (!value) return null;
  return `enc:${value}`;
}

async function audit(table: string, record: string, action: string, payload?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    p_new: (payload ?? {}) as Json,
  });
}

async function logPayment(paymentId: string | null, gatewayId: string | null, message: string, level = "info", metadata: Record<string, unknown> = {}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("payment_logs").insert({
    payment_id: paymentId,
    gateway_id: gatewayId,
    level,
    message,
    metadata: metadata as Json,
  });
}

// --------------------------- Gateways ---------------------------

export async function createPaymentGateway(input: {
  display_name: string;
  provider: string;
  sandbox?: boolean;
  api_key?: string | null;
  api_secret?: string | null;
  webhook_secret?: string | null;
  webhook_url?: string | null;
  currency?: string;
  is_enabled?: boolean;
  priority?: number;
}): Promise<PaymentActionResult> {
  await guard();
  const parsed = gatewayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_gateways")
    .insert({
      display_name: parsed.data.display_name,
      provider: parsed.data.provider,
      sandbox: parsed.data.sandbox,
      api_key_encrypted: enc(parsed.data.api_key),
      api_secret_encrypted: enc(parsed.data.api_secret),
      webhook_secret_encrypted: enc(parsed.data.webhook_secret),
      webhook_url: parsed.data.webhook_url,
      currency: parsed.data.currency,
      is_enabled: parsed.data.is_enabled,
      priority: parsed.data.priority,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("payment_gateways", data.id, "create");
  revalidate(data.id);
  return { ok: true, error: null, id: data.id };
}

export async function updatePaymentGateway(
  id: string,
  input: Parameters<typeof createPaymentGateway>[0],
): Promise<PaymentActionResult> {
  await guard();
  const parsed = gatewayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const patch: Database["public"]["Tables"]["payment_gateways"]["Update"] = {
    display_name: parsed.data.display_name,
    provider: parsed.data.provider,
    sandbox: parsed.data.sandbox,
    webhook_url: parsed.data.webhook_url,
    currency: parsed.data.currency,
    is_enabled: parsed.data.is_enabled,
    priority: parsed.data.priority,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.api_key) patch.api_key_encrypted = enc(parsed.data.api_key);
  if (parsed.data.api_secret) patch.api_secret_encrypted = enc(parsed.data.api_secret);
  if (parsed.data.webhook_secret) patch.webhook_secret_encrypted = enc(parsed.data.webhook_secret);

  const { error } = await supabase.from("payment_gateways").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("payment_gateways", id, "update");
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function enablePaymentGateway(id: string): Promise<PaymentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_gateways").update({ is_enabled: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("payment_gateways", id, "enable");
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function disablePaymentGateway(id: string): Promise<PaymentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payment_gateways").update({ is_enabled: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("payment_gateways", id, "disable");
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function archivePaymentGateway(id: string): Promise<PaymentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_gateways")
    .update({ lifecycle_status: "archived", is_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("payment_gateways", id, "archive");
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function deletePaymentGateway(id: string): Promise<PaymentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_gateways")
    .update({ deleted_at: new Date().toISOString(), is_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("payment_gateways", id, "delete");
  revalidate();
  return { ok: true, error: null, id };
}

export async function bulkDeletePaymentGateways(ids: string[]): Promise<PaymentActionResult> {
  const parsed = bulkGatewayIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No gateways selected." };
  for (const id of parsed.data.ids) {
    const res = await deletePaymentGateway(id);
    if (!res.ok) return res;
  }
  return { ok: true, error: null };
}

// --------------------------- Payment actions ---------------------------

export async function manualCapturePayment(paymentId: string): Promise<PaymentActionResult> {
  await guard();
  const parsed = manualCaptureSchema.safeParse({ payment_id: paymentId });
  if (!parsed.success) return { ok: false, error: "Invalid payment." };

  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (!p) return { ok: false, error: "Payment not found." };

  let gatewayProvider: GatewayProvider = "custom";
  if (p.gateway_id) {
    const { data: g } = await supabase.from("payment_gateways").select("provider").eq("id", p.gateway_id).maybeSingle();
    if (g) gatewayProvider = g.provider as GatewayProvider;
  }

  const adapter = getPaymentGatewayAdapter(gatewayProvider);
  const result = await adapter.capturePayment({
    gatewayTxnId: p.gateway_txn_id ?? p.id,
    amount: p.amount,
    currency: p.currency,
  });

  if (!result.success) {
    await logPayment(paymentId, p.gateway_id, `Manual capture failed: ${result.message}`, "error");
    return { ok: false, error: result.message ?? "Capture failed." };
  }

  const status: PaymentStatus = "captured";
  await supabase
    .from("payments")
    .update({ status, captured_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", paymentId);

  await supabase.from("payment_transactions").insert({
    payment_id: paymentId,
    txn_ref: `capture-${Date.now()}`,
    gateway_txn_id: p.gateway_txn_id,
    amount: p.amount,
    status,
    raw: { placeholder: true, action: "manual_capture" } as Json,
  });

  await logPayment(paymentId, p.gateway_id, "Manual capture recorded (placeholder mode).");
  await audit("payments", paymentId, "capture");
  await runReconciliationForPayment(paymentId);
  revalidate(paymentId);
  return { ok: true, error: null, id: paymentId };
}

export async function manualRefundPayment(input: {
  payment_id: string;
  amount: number;
  reason?: string | null;
  full?: boolean;
}): Promise<PaymentActionResult> {
  await guard();
  const parsed = manualRefundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid refund." };

  const supabase = await createSupabaseServerClient();
  const { data: p } = await supabase.from("payments").select("*").eq("id", parsed.data.payment_id).maybeSingle();
  if (!p) return { ok: false, error: "Payment not found." };

  let gatewayProvider: GatewayProvider = "custom";
  if (p.gateway_id) {
    const { data: g } = await supabase.from("payment_gateways").select("provider").eq("id", p.gateway_id).maybeSingle();
    if (g) gatewayProvider = g.provider as GatewayProvider;
  }

  const adapter = getPaymentGatewayAdapter(gatewayProvider);
  const result = await adapter.refundPayment({
    gatewayTxnId: p.gateway_txn_id ?? p.id,
    amount: parsed.data.amount,
    currency: p.currency,
    reason: parsed.data.reason,
  });

  if (!result.success) {
    await logPayment(parsed.data.payment_id, p.gateway_id, `Manual refund failed: ${result.message}`, "error");
    return { ok: false, error: result.message ?? "Refund failed." };
  }

  const refundStatus: PaymentStatus = parsed.data.full || parsed.data.amount >= p.amount ? "refunded" : "partially_refunded";
  await supabase.from("payments").update({ status: refundStatus, updated_at: new Date().toISOString() }).eq("id", parsed.data.payment_id);

  await supabase.from("order_refunds").insert({
    order_id: p.order_id,
    payment_id: parsed.data.payment_id,
    amount: parsed.data.amount,
    reason: parsed.data.reason ?? "Manual refund",
    status: refundStatus,
  });

  await logPayment(parsed.data.payment_id, p.gateway_id, `Manual refund ₹${parsed.data.amount} (placeholder mode).`);
  await audit("payments", parsed.data.payment_id, "refund", { amount: parsed.data.amount });
  revalidate(parsed.data.payment_id);
  return { ok: true, error: null, id: parsed.data.payment_id };
}

export async function syncSettlement(input: { gateway_id: string; settlement_date: string }): Promise<PaymentActionResult> {
  await guard();
  const parsed = syncSettlementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settlement sync." };

  const supabase = await createSupabaseServerClient();
  const { data: g } = await supabase.from("payment_gateways").select("provider").eq("id", parsed.data.gateway_id).maybeSingle();
  if (!g) return { ok: false, error: "Gateway not found." };

  const adapter = getPaymentGatewayAdapter(g.provider as GatewayProvider);
  const result = await adapter.syncSettlement({ settlementDate: parsed.data.settlement_date });

  const expected = result.data?.expected ?? 0;
  const received = result.data?.received ?? 0;
  const difference = received - expected;
  const status = result.success ? (difference === 0 ? "matched" : "mismatch") : "pending";

  const { data: settlement, error } = await supabase
    .from("settlements")
    .insert({
      gateway_id: parsed.data.gateway_id,
      settlement_date: parsed.data.settlement_date,
      expected_amount: expected,
      received_amount: received,
      difference,
      status,
      synced_at: new Date().toISOString(),
      bank_reference: result.success ? `SYNC-${parsed.data.settlement_date}` : null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await audit("settlements", settlement.id, "sync", { gateway_id: parsed.data.gateway_id, message: result.message });
  revalidate();
  return { ok: true, error: result.success ? null : result.message ?? "Gateway not connected — settlement stub created.", id: settlement.id };
}

export async function replayPaymentWebhook(webhookId: string): Promise<PaymentActionResult> {
  await guard();
  const result = await replayWebhook(webhookId);
  revalidate();
  return { ok: result.ok, error: result.error, id: webhookId };
}

export async function markWebhookProcessed(webhookId: string): Promise<PaymentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("payment_webhooks")
    .update({ processed: true, processed_at: new Date().toISOString(), error: null })
    .eq("id", webhookId);
  if (error) return { ok: false, error: error.message };
  await audit("payment_webhooks", webhookId, "mark_processed");
  revalidate();
  return { ok: true, error: null, id: webhookId };
}

export { replayWebhook };
