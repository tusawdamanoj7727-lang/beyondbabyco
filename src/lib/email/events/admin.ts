import "server-only";

import { absoluteUrl } from "@/lib/seo/site";

import { getSmtpConfig } from "../config";
import { resolveContactEmailData, resolveCustomerEmailData } from "../data-resolvers";
import { sendTemplateEmailAsync } from "../send-template";

function notifyAdmin(templateId: string, data: Record<string, string>): void {
  const adminEmail = getSmtpConfig()?.adminAlertEmail;
  if (!adminEmail) return;
  sendTemplateEmailAsync(templateId, adminEmail, data);
}

export function onNewCustomer(customerId: string): void {
  void (async () => {
    const data = await resolveCustomerEmailData(customerId, {
      admin_customers_url: absoluteUrl("/admin/customers"),
    });
    if (!data) return;
    notifyAdmin("admin-new-customer", data);
    if (data.customer_email) {
      sendTemplateEmailAsync("welcome", data.customer_email, data);
      sendTemplateEmailAsync("account-created", data.customer_email, data);
    }
  })().catch((e) => console.error("[email] onNewCustomer failed:", e));
}

export function onContactFormSubmitted(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): void {
  const data = resolveContactEmailData(input);
  notifyAdmin("admin-contact-form", {
    ...data,
    admin_support_url: absoluteUrl("/admin/support"),
  });
  sendTemplateEmailAsync("contact-auto-reply", input.email, data);
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
    notifyAdmin("admin-refund-request", data);
  })().catch((e) => console.error("[email] onRefundRequested failed:", e));
}

export function onLowStockAlert(input: {
  productName: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}): void {
  notifyAdmin("admin-low-stock", {
    product_name: input.productName,
    product_sku: input.sku,
    stock_quantity: String(input.quantity),
    reorder_level: String(input.reorderLevel),
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  });
}

export function onOutOfStockAlert(input: { productName: string; sku: string }): void {
  notifyAdmin("admin-out-of-stock", {
    product_name: input.productName,
    product_sku: input.sku,
    admin_inventory_url: absoluteUrl("/admin/inventory"),
  });
}

export function onNewsletterSubscribed(email: string, name?: string): void {
  sendTemplateEmailAsync("newsletter-confirmation", email, {
    customer_name: name ?? email.split("@")[0] ?? "Subscriber",
    customer_email: email,
    verify_link: absoluteUrl("/account/profile"),
  });
  sendTemplateEmailAsync("subscription-confirmation", email, {
    customer_name: name ?? email.split("@")[0] ?? "Subscriber",
    customer_email: email,
  });
}
