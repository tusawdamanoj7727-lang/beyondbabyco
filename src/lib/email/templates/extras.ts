import { EMAIL_BRAND } from "@/lib/communications/brand";
import { BASE_SAMPLE_DATA } from "@/lib/communications/sample-data";
import type { EmailTemplate } from "@/lib/communications/types";

function tpl(
  partial: Omit<EmailTemplate, "sampleData"> & { extraSample?: Record<string, string> },
): EmailTemplate {
  return {
    showTrustBadges: true,
    ...partial,
    sampleData: { ...BASE_SAMPLE_DATA, ...partial.extraSample },
  };
}

const p = (text: string) => `<p style="margin:0 0 16px;">${text}</p>`;

export const ADMIN_EMAIL_TEMPLATES: EmailTemplate[] = [
  tpl({
    id: "admin-new-order",
    name: "Admin New Order",
    category: "order",
    subject: "[Admin] New order {{order_number}} — {{order_total}}",
    preheader: "A new order was placed on BeyondBabyCo.",
    heading: "New Order Received",
    bodyHtml: `${p("A new order has been placed.")}${p("<strong>Order:</strong> {{order_number}}")}${p("<strong>Customer:</strong> {{customer_name}} ({{customer_email}})")}${p("<strong>Total:</strong> {{order_total}}")}${p("<strong>Payment:</strong> {{payment_method}}")}`,
    cta: { label: "View in Admin", href: "{{admin_order_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-new-customer",
    name: "Admin New Customer",
    category: "account",
    subject: "[Admin] New customer — {{customer_name}}",
    preheader: "A new customer registered on BeyondBabyCo.",
    heading: "New Customer Registered",
    bodyHtml: `${p("A new customer account was created.")}${p("<strong>Name:</strong> {{customer_name}}")}${p("<strong>Email:</strong> {{customer_email}}")}`,
    cta: { label: "View Customers", href: "{{admin_customers_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-contact-form",
    name: "Admin Contact Form",
    category: "marketing",
    subject: "[Admin] Contact form — {{contact_subject}}",
    preheader: "New contact form submission.",
    heading: "New Contact Form Submission",
    bodyHtml: `${p("<strong>From:</strong> {{customer_name}} ({{customer_email}})")}${p("<strong>Subject:</strong> {{contact_subject}}")}${p("<strong>Message:</strong><br/>{{contact_message}}")}`,
    cta: { label: "View in Admin", href: "{{admin_support_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-payment-failure",
    name: "Admin Payment Failure",
    category: "order",
    subject: "[Admin] Payment failed — {{order_number}}",
    preheader: "A customer payment failed.",
    heading: "Payment Failure Alert",
    bodyHtml: `${p("Payment failed for order {{order_number}}.")}${p("<strong>Customer:</strong> {{customer_name}}")}${p("<strong>Amount:</strong> {{order_total}}")}`,
    cta: { label: "View Order", href: "{{admin_order_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-refund-request",
    name: "Admin Refund Request",
    category: "order",
    subject: "[Admin] Refund request — {{order_number}}",
    preheader: "A customer requested a refund.",
    heading: "Refund Request",
    bodyHtml: `${p("Refund requested for order {{order_number}}.")}${p("<strong>Customer:</strong> {{customer_name}}")}${p("<strong>Reason:</strong> {{return_reason}}")}`,
    cta: { label: "Review Return", href: "{{admin_order_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-low-stock",
    name: "Admin Low Stock",
    category: "marketing",
    subject: "[Admin] Low stock — {{product_name}}",
    preheader: "Inventory is running low.",
    heading: "Low Stock Alert",
    bodyHtml: `${p("<strong>Product:</strong> {{product_name}}")}${p("<strong>SKU:</strong> {{product_sku}}")}${p("<strong>Available:</strong> {{stock_quantity}} (reorder at {{reorder_level}})")}`,
    cta: { label: "Manage Inventory", href: "{{admin_inventory_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "admin-out-of-stock",
    name: "Admin Out of Stock",
    category: "marketing",
    subject: "[Admin] Out of stock — {{product_name}}",
    preheader: "A product is now out of stock.",
    heading: "Out of Stock Alert",
    bodyHtml: `${p("<strong>Product:</strong> {{product_name}}")}${p("<strong>SKU:</strong> {{product_sku}}")}${p("This SKU has reached zero available quantity.")}`,
    cta: { label: "Manage Inventory", href: "{{admin_inventory_url}}" },
    showTrustBadges: false,
  }),
];

export const EXTRA_ACCOUNT_EMAIL_TEMPLATES: EmailTemplate[] = [
  tpl({
    id: "login-notification",
    name: "Login Notification",
    category: "account",
    subject: "New sign-in to your BeyondBabyCo account",
    preheader: "We noticed a new sign-in to your account.",
    heading: "New Sign-In Detected",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your BeyondBabyCo account was just signed in.")}${p(`If this was you, no action is needed. If not, reset your password immediately and contact us at ${EMAIL_BRAND.contact.email}.`)}`,
    cta: { label: "Account Settings", href: "{{site_url}}/account/profile" },
    showTrustBadges: false,
  }),
  tpl({
    id: "otp-email",
    name: "OTP Email",
    category: "account",
    subject: "Your BeyondBabyCo verification code",
    preheader: "Use this one-time code to continue.",
    heading: "Your Verification Code",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your one-time verification code is:")}${p("<strong style=\"font-size:28px;letter-spacing:4px;color:#cd6a45;\">{{otp_code}}</strong>")}${p("This code expires in 10 minutes. Do not share it with anyone.")}`,
    showTrustBadges: false,
    extraSample: { otp_code: "482910" },
  }),
  tpl({
    id: "subscription-confirmation",
    name: "Subscription Confirmation",
    category: "marketing",
    subject: "You're subscribed to BeyondBabyCo updates",
    preheader: "Thanks for subscribing to our newsletter.",
    heading: "Subscription Confirmed",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("You're now subscribed to BeyondBabyCo updates — research insights, new arrivals, and gentle care tips.")}${p("You can unsubscribe anytime from your account or any email footer.")}`,
    cta: { label: "Explore Products", href: "{{site_url}}/products" },
  }),
];

export const CONTACT_EMAIL_TEMPLATES: EmailTemplate[] = [
  tpl({
    id: "contact-auto-reply",
    name: "Contact Form Auto Reply",
    category: "marketing",
    subject: "We received your message — BeyondBabyCo",
    preheader: "Our team will respond shortly.",
    heading: "Thanks for Reaching Out",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("We've received your message about <strong>{{contact_subject}}</strong> and will get back to you within one business day.")}${p("For urgent order help, include your order number in any reply.")}`,
    cta: { label: "Visit Help Center", href: "{{support_url}}" },
  }),
  tpl({
    id: "newsletter-confirmation",
    name: "Newsletter Confirmation",
    category: "marketing",
    subject: "Confirm your BeyondBabyCo newsletter subscription",
    preheader: "One click to confirm your subscription.",
    heading: "Confirm Your Subscription",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Please confirm you'd like to receive BeyondBabyCo newsletters with parenting tips, research stories, and exclusive offers.")}`,
    cta: { label: "Confirm Subscription", href: "{{verify_link}}" },
  }),
];
