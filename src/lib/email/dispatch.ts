import "server-only";

import { absoluteUrl } from "@/lib/seo/site";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { generateOrderInvoiceAttachment } from "@/lib/invoices/generate-order-invoice";
import { issueInvoiceToken } from "@/lib/invoices/token";

import { getSmtpConfig } from "./config";
import { resolveOrderEmailData } from "./data-resolvers";
import { sendTemplateEmail } from "./send-template";

const PAID_STATUSES = new Set(["paid", "captured"]);

const PREPAID_CONFIRMATION_TEMPLATES = new Set([
  "order-confirmation",
  "invoice",
  "payment-received",
]);

/** Templates that should include the tax invoice PDF when available. */
const INVOICE_ATTACHMENT_TEMPLATES = new Set([
  "invoice",
  "admin-new-order",
  "order-confirmation",
  "cod-confirmation",
]);

/** Skip duplicate sends while another worker owns a fresh pending claim. */
const PENDING_CLAIM_TTL_MS = 5 * 60 * 1000;

export interface DispatchOrderEmailResult {
  sent: boolean;
  skipped: boolean;
  error?: string;
}

export type DispatchOrderEmailOptions = {
  admin?: boolean;
  /** Bypass already-sent guard (admin resend). */
  force?: boolean;
};

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

function isFreshPending(sentAt: string | null | undefined): boolean {
  if (!sentAt) return false;
  const age = Date.now() - new Date(sentAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < PENDING_CLAIM_TTL_MS;
}

export async function dispatchOrderEmail(
  orderId: string,
  templateId: string,
  options?: DispatchOrderEmailOptions,
): Promise<DispatchOrderEmailResult> {
  const supabase = createSupabaseServiceClient();

  const ctx = await getOrderPaymentContext(orderId);
  if (!ctx) {
    console.info(
      JSON.stringify({
        scope: "email.dispatch",
        step: "early_return",
        why: "order_not_found",
        orderId,
        templateId,
      }),
    );
    return { sent: false, skipped: true, error: "Order not found." };
  }

  if (!passesTemplateGuard(templateId, ctx, options)) {
    console.info(
      JSON.stringify({
        scope: "email.dispatch",
        step: "early_return",
        why: "template_guard",
        orderId,
        templateId,
        paymentMethod: ctx.paymentMethod,
        paymentStatus: ctx.paymentStatus,
        orderStatus: ctx.orderStatus,
      }),
    );
    return { sent: false, skipped: true };
  }

  const { data: existing } = await supabase
    .from("order_email_logs")
    .select("status, sent_at, recipient")
    .eq("order_id", orderId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (!options?.force && existing?.status === "sent") {
    console.info(
      JSON.stringify({
        scope: "email.dispatch",
        step: "early_return",
        why: "already_sent",
        orderId,
        templateId,
      }),
    );
    return { sent: false, skipped: true };
  }

  if (!options?.force && existing?.status === "pending" && isFreshPending(existing.sent_at)) {
    console.info(
      JSON.stringify({
        scope: "email.dispatch",
        step: "early_return",
        why: "pending_in_flight",
        orderId,
        templateId,
      }),
    );
    return { sent: false, skipped: true };
  }

  const invoiceToken = issueInvoiceToken(orderId);
  const secureInvoiceUrl = absoluteUrl(
    `/api/invoices/${orderId}?token=${encodeURIComponent(invoiceToken)}`,
  );

  const data = await resolveOrderEmailData(orderId, {
    invoice_url: secureInvoiceUrl,
  });
  if (!data?.customer_email && !options?.admin) {
    return { sent: false, skipped: true, error: "Customer email not found." };
  }

  const recipient = options?.admin
    ? (getSmtpConfig()?.adminAlertEmail ?? "")
    : (data?.customer_email ?? "");

  if (!recipient) {
    return { sent: false, skipped: true, error: "Recipient not configured." };
  }

  const claimedAt = new Date().toISOString();
  const { error: claimError } = await supabase.from("order_email_logs").upsert(
    {
      order_id: orderId,
      template_id: templateId,
      recipient,
      status: "pending",
      error_message: null,
      sent_at: claimedAt,
    },
    { onConflict: "order_id,template_id" },
  );

  if (claimError) {
    console.error(
      JSON.stringify({
        scope: "email.dispatch",
        step: "claim_failed",
        orderId,
        templateId,
        error: claimError.message,
      }),
    );
    return { sent: false, skipped: false, error: claimError.message };
  }

  console.info(
    JSON.stringify({
      scope: "email.dispatch",
      step: "claimed_pending",
      orderId,
      templateId,
      recipient,
    }),
  );

  const payload = {
    ...data,
    order_id: orderId,
    invoice_url: secureInvoiceUrl,
    admin_order_url: absoluteUrl(`/admin/orders/${orderId}`),
    admin_customers_url: absoluteUrl("/admin/customers"),
    admin_support_url: absoluteUrl("/admin/support"),
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  } as Record<string, string>;

  let attachments: NonNullable<Awaited<ReturnType<typeof generateOrderInvoiceAttachment>>>[] = [];
  if (INVOICE_ATTACHMENT_TEMPLATES.has(templateId)) {
    try {
      const pdf = await generateOrderInvoiceAttachment(orderId);
      if (pdf) attachments.push(pdf);
    } catch (err) {
      console.error(
        JSON.stringify({
          scope: "email.dispatch",
          step: "invoice_attach_failed",
          orderId,
          templateId,
          error: err instanceof Error ? err.message : "unknown",
        }),
      );
    }
  }

  const result = await sendTemplateEmail(templateId, recipient, payload, {
    attachments,
  });
  const finalStatus = result.ok ? "sent" : "failed";

  await supabase.from("order_email_logs").upsert(
    {
      order_id: orderId,
      template_id: templateId,
      recipient,
      status: finalStatus,
      error_message: result.ok ? null : (result.error ?? "Send failed"),
      sent_at: new Date().toISOString(),
    },
    { onConflict: "order_id,template_id" },
  );

  console.info(
    JSON.stringify({
      scope: "email.dispatch",
      step: "send_complete",
      orderId,
      templateId,
      status: finalStatus,
      attachedInvoice: attachments.length > 0,
      error: result.ok ? null : (result.error ?? "Send failed"),
    }),
  );

  return {
    sent: result.ok,
    skipped: false,
    error: result.ok ? undefined : result.error,
  };
}

/** Fire-and-forget — do NOT use for order completion (COD / Razorpay). */
export function dispatchOrderEmailAsync(
  orderId: string,
  templateId: string,
  options?: DispatchOrderEmailOptions,
): void {
  void dispatchOrderEmail(orderId, templateId, options).catch((error) => {
    console.error(`[email] dispatch ${templateId} for order ${orderId} failed:`, error);
  });
}
