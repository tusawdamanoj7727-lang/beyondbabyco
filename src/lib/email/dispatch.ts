import "server-only";

import { absoluteUrl } from "@/lib/seo/site";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { getSmtpConfig } from "./config";
import { resolveOrderEmailData } from "./data-resolvers";
import { sendTemplateEmail } from "./send-template";

const PAID_STATUSES = new Set(["paid", "captured"]);

const PREPAID_CONFIRMATION_TEMPLATES = new Set([
  "order-confirmation",
  "invoice",
  "payment-received",
]);

export interface DispatchOrderEmailResult {
  sent: boolean;
  skipped: boolean;
  error?: string;
}

async function getOrderPaymentContext(orderId: string): Promise<{
  paymentMethod: string | null;
  paymentStatus: string | null;
  orderStatus: string | null;
} | null> {
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, provider")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentMethod = payment?.method ?? payment?.provider ?? null;

  return {
    paymentMethod,
    paymentStatus: payment?.status ?? null,
    orderStatus: order.status,
  };
}

function passesTemplateGuard(
  templateId: string,
  ctx: { paymentMethod: string | null; paymentStatus: string | null; orderStatus: string | null },
  options?: { admin?: boolean },
): boolean {
  if (options?.admin) return true;

  if (templateId === "payment-failed" || templateId === "admin-payment-failure") {
    return ctx.paymentStatus !== null && !PAID_STATUSES.has(ctx.paymentStatus);
  }

  if (templateId === "order-cancelled") {
    return ctx.orderStatus === "cancelled";
  }

  if (ctx.orderStatus === "cancelled") return false;

  if (templateId === "cod-confirmation") {
    return ctx.paymentMethod === "cod";
  }

  if (PREPAID_CONFIRMATION_TEMPLATES.has(templateId)) {
    if (ctx.paymentMethod === "cod") return false;
    return ctx.paymentStatus !== null && PAID_STATUSES.has(ctx.paymentStatus);
  }

  return true;
}

export async function dispatchOrderEmail(
  orderId: string,
  templateId: string,
  options?: { admin?: boolean },
): Promise<DispatchOrderEmailResult> {
  const supabase = createSupabaseServiceClient();

  const ctx = await getOrderPaymentContext(orderId);
  if (!ctx) return { sent: false, skipped: true, error: "Order not found." };

  if (!passesTemplateGuard(templateId, ctx, options)) {
    return { sent: false, skipped: true };
  }

  const { data: existing } = await supabase
    .from("order_email_logs")
    .select("status")
    .eq("order_id", orderId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (existing?.status === "sent") {
    return { sent: false, skipped: true };
  }

  const data = await resolveOrderEmailData(orderId);
  if (!data?.customer_email && !options?.admin) {
    return { sent: false, skipped: true, error: "Customer email not found." };
  }

  const recipient = options?.admin
    ? (getSmtpConfig()?.adminAlertEmail ?? "")
    : (data?.customer_email ?? "");

  if (!recipient) {
    return { sent: false, skipped: true, error: "Recipient not configured." };
  }

  const payload = {
    ...data,
    order_id: orderId,
    admin_order_url: absoluteUrl(`/admin/orders/${orderId}`),
    admin_customers_url: absoluteUrl("/admin/customers"),
    admin_support_url: absoluteUrl("/admin/support"),
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  } as Record<string, string>;

  if (options?.admin) {
    const result = await sendTemplateEmail(templateId, recipient, payload);
    await supabase.from("order_email_logs").upsert(
      {
        order_id: orderId,
        template_id: templateId,
        recipient,
        status: result.ok ? "sent" : "failed",
        error_message: result.ok ? null : (result.error ?? "Send failed"),
        sent_at: new Date().toISOString(),
      },
      { onConflict: "order_id,template_id" },
    );
    return {
      sent: result.ok,
      skipped: false,
      error: result.ok ? undefined : result.error,
    };
  }

  const result = await sendTemplateEmail(templateId, recipient, payload);

  await supabase.from("order_email_logs").upsert(
    {
      order_id: orderId,
      template_id: templateId,
      recipient,
      status: result.ok ? "sent" : "failed",
      error_message: result.ok ? null : (result.error ?? "Send failed"),
      sent_at: new Date().toISOString(),
    },
    { onConflict: "order_id,template_id" },
  );

  return {
    sent: result.ok,
    skipped: false,
    error: result.ok ? undefined : result.error,
  };
}

/** Fire-and-forget wrapper — safe to call from checkout without blocking. */
export function dispatchOrderEmailAsync(
  orderId: string,
  templateId: string,
  options?: { admin?: boolean },
): void {
  void dispatchOrderEmail(orderId, templateId, options).catch((error) => {
    console.error(`[email] dispatch ${templateId} for order ${orderId} failed:`, error);
  });
}
