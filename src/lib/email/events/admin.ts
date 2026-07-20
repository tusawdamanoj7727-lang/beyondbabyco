import "server-only";

import { absoluteUrl } from "@/lib/seo/site";

import { getSmtpConfig } from "../config";
import { resolveContactEmailData, resolveCustomerEmailData } from "../data-resolvers";
import { sendTemplateEmail } from "../send-template";

async function notifyAdmin(templateId: string, data: Record<string, string>): Promise<void> {
  const adminEmail = getSmtpConfig()?.adminAlertEmail;
  if (!adminEmail) return;
  const result = await sendTemplateEmail(templateId, adminEmail, data);
  if (!result.ok) {
    console.error(`[email] admin template ${templateId} failed:`, result.error);
  }
}

export async function onNewCustomer(customerId: string): Promise<void> {
  try {
    const data = await resolveCustomerEmailData(customerId, {
      admin_customers_url: absoluteUrl("/admin/customers"),
    });
    if (!data) return;
    await notifyAdmin("admin-new-customer", data);
    if (data.customer_email) {
      const welcome = await sendTemplateEmail("welcome", data.customer_email, data);
      if (!welcome.ok) console.error("[email] welcome failed:", welcome.error);
      const created = await sendTemplateEmail("account-created", data.customer_email, data);
      if (!created.ok) console.error("[email] account-created failed:", created.error);
    }
  } catch (e) {
    console.error("[email] onNewCustomer failed:", e);
  }
}

export async function onContactFormSubmitted(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  try {
    const data = resolveContactEmailData(input);
    await notifyAdmin("admin-contact-form", {
      ...data,
      admin_support_url: absoluteUrl("/admin/support"),
    });
    const reply = await sendTemplateEmail("contact-auto-reply", input.email, data);
    if (!reply.ok) console.error("[email] contact-auto-reply failed:", reply.error);
  } catch (e) {
    console.error("[email] onContactFormSubmitted failed:", e);
  }
}

export function onRefundRequested(orderId: string, reason: string): void {
  void (async () => {
    const { resolveOrderEmailData } = await import("../data-resolvers");
    const data = await resolveOrderEmailData(orderId, {
      return_reason: reason,
      admin_order_url: absoluteUrl(`/admin/orders/${orderId}`),
      order_id: orderId,
    });
    if (!data) return;
    await notifyAdmin("admin-refund-request", data);
  })().catch((e) => console.error("[email] onRefundRequested failed:", e));
}

export function onLowStockAlert(input: {
  productName: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}): void {
  void notifyAdmin("admin-low-stock", {
    product_name: input.productName,
    product_sku: input.sku,
    stock_quantity: String(input.quantity),
    reorder_level: String(input.reorderLevel),
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  });
}

export function onOutOfStockAlert(input: { productName: string; sku: string }): void {
  void notifyAdmin("admin-out-of-stock", {
    product_name: input.productName,
    product_sku: input.sku,
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  });
}

export function onNewsletterSubscribed(email: string, name?: string): void {
  void sendTemplateEmail("newsletter-confirmation", email, {
    customer_name: name || "there",
    customer_email: email,
  }).catch((e) => console.error("[email] newsletter-confirmation failed:", e));
  void sendTemplateEmail("subscription-confirmation", email, {
    customer_name: name || "there",
    customer_email: email,
  }).catch((e) => console.error("[email] subscription-confirmation failed:", e));
}
