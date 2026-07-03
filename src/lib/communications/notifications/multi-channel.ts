import { BASE_SAMPLE_DATA } from "../sample-data";
import type { MultiChannelNotification, NotificationCategory, NotificationPriority } from "../types";

function n(
  partial: Omit<MultiChannelNotification, "sampleData"> & { extraSample?: Record<string, string> },
): MultiChannelNotification {
  return { ...partial, sampleData: { ...BASE_SAMPLE_DATA, ...partial.extraSample } };
}

function ch(
  title: string,
  body: string,
  opts: {
    cta?: { label: string; href: string };
    icon?: string;
    deepLink?: string;
    priority?: NotificationPriority;
  } = {},
) {
  return {
    title,
    body,
    cta: opts.cta,
    icon: opts.icon ?? "bell",
    deepLink: opts.deepLink,
    priority: opts.priority ?? "normal",
  };
}

/** Multi-channel notification templates mapped to email template IDs. */
export const NOTIFICATION_TEMPLATES: MultiChannelNotification[] = [
  n({
    id: "welcome",
    name: "Welcome",
    category: "account",
    emailTemplateId: "welcome",
    channels: {
      email: ch("Welcome to BeyondBabyCo!", "Your account is ready.", { icon: "heart", priority: "normal" }),
      push: ch("Welcome!", "Explore research-backed baby care.", { deepLink: "/products", icon: "heart" }),
      in_app: ch("Welcome to BeyondBabyCo", "Your account is ready. Explore our products.", {
        deepLink: "/products",
        icon: "heart",
        cta: { label: "Shop Now", href: "/products" },
      }),
    },
  }),
  n({
    id: "order-placed",
    name: "Order Placed",
    category: "orders",
    emailTemplateId: "order-confirmation",
    channels: {
      email: ch("Order Confirmed", "Order {{order_number}} confirmed.", { icon: "package" }),
      push: ch("Order Confirmed", "{{order_number}} — we're preparing your order.", {
        deepLink: "/account/orders",
        icon: "package",
        priority: "high",
      }),
      sms: ch("BeyondBabyCo", "Order {{order_number}} confirmed. Track: {{site_url}}/account/orders", {
        priority: "high",
      }),
      whatsapp: ch("Order Confirmed ✅", "Hi {{customer_name}}, order {{order_number}} ({{order_total}}) is confirmed.", {
        cta: { label: "Track Order", href: "{{order_url}}" },
        priority: "high",
      }),
      in_app: ch("Order Confirmed", "Order {{order_number}} for {{order_total}} is confirmed.", {
        deepLink: "/account/orders",
        icon: "package",
        cta: { label: "View Order", href: "/account/orders" },
        priority: "high",
      }),
    },
  }),
  n({
    id: "payment-success",
    name: "Payment Success",
    category: "payments",
    emailTemplateId: "payment-received",
    channels: {
      push: ch("Payment Received", "{{order_total}} received for {{order_number}}.", {
        deepLink: "/account/orders",
        icon: "credit-card",
        priority: "high",
      }),
      in_app: ch("Payment Received", "Payment of {{order_total}} confirmed.", {
        deepLink: "/account/orders",
        icon: "credit-card",
        priority: "high",
      }),
    },
  }),
  n({
    id: "payment-failed",
    name: "Payment Failed",
    category: "payments",
    emailTemplateId: "payment-failed",
    channels: {
      push: ch("Payment Failed", "Please retry payment for {{order_number}}.", {
        deepLink: "/account/orders",
        icon: "alert-circle",
        priority: "urgent",
      }),
      in_app: ch("Payment Failed", "Payment for {{order_number}} could not be processed.", {
        deepLink: "/account/orders",
        icon: "alert-circle",
        cta: { label: "Retry", href: "/account/orders" },
        priority: "urgent",
      }),
    },
  }),
  n({
    id: "shipment-dispatched",
    name: "Shipment Dispatched",
    category: "delivery",
    emailTemplateId: "shipment-created",
    channels: {
      push: ch("Order Shipped", "{{order_number}} dispatched. Track: {{tracking_number}}", {
        deepLink: "/account/orders",
        icon: "truck",
        priority: "high",
      }),
      sms: ch("BeyondBabyCo", "Order {{order_number}} shipped. Track: {{tracking_number}}", { priority: "normal" }),
      whatsapp: ch("Order Shipped 📦", "Order {{order_number}} dispatched via {{carrier_name}}.", {
        cta: { label: "Track", href: "{{order_url}}" },
      }),
      in_app: ch("Order Shipped", "Order {{order_number}} is on its way.", {
        deepLink: "/account/orders",
        icon: "truck",
        cta: { label: "Track", href: "/account/orders" },
      }),
    },
  }),
  n({
    id: "in-transit",
    name: "In Transit",
    category: "delivery",
    emailTemplateId: "in-transit",
    channels: {
      push: ch("In Transit", "Order {{order_number}} is in transit.", { deepLink: "/account/orders", icon: "truck" }),
      in_app: ch("In Transit", "Your package is on the way. Est. {{estimated_delivery}}.", {
        deepLink: "/account/orders",
        icon: "truck",
      }),
    },
  }),
  n({
    id: "out-for-delivery",
    name: "Out For Delivery",
    category: "delivery",
    emailTemplateId: "delivery-out-for-delivery",
    channels: {
      push: ch("Out For Delivery", "Order {{order_number}} arrives today!", {
        deepLink: "/account/orders",
        icon: "map-pin",
        priority: "high",
      }),
      sms: ch("BeyondBabyCo", "Order {{order_number}} out for delivery today.", { priority: "high" }),
      in_app: ch("Out For Delivery", "Order {{order_number}} will arrive today.", {
        deepLink: "/account/orders",
        icon: "map-pin",
        priority: "high",
      }),
    },
  }),
  n({
    id: "delivered",
    name: "Delivered",
    category: "delivery",
    emailTemplateId: "delivery-delivered",
    channels: {
      push: ch("Delivered!", "Order {{order_number}} has been delivered.", {
        deepLink: "/account/orders",
        icon: "check-circle",
      }),
      in_app: ch("Delivered", "Order {{order_number}} delivered successfully.", {
        deepLink: "/account/orders",
        icon: "check-circle",
        cta: { label: "Leave Review", href: "/products" },
      }),
    },
  }),
  n({
    id: "delivery-failed",
    name: "Delivery Failed",
    category: "delivery",
    emailTemplateId: "delivery-failed",
    channels: {
      push: ch("Delivery Failed", "Could not deliver {{order_number}}. We'll retry.", {
        deepLink: "/account/support",
        icon: "alert-triangle",
        priority: "urgent",
      }),
      in_app: ch("Delivery Failed", "Delivery attempt failed for {{order_number}}.", {
        deepLink: "/account/support",
        icon: "alert-triangle",
        cta: { label: "Get Help", href: "/account/support" },
        priority: "urgent",
      }),
    },
  }),
  n({
    id: "coupon-offer",
    name: "Coupon Offer",
    category: "offers",
    emailTemplateId: "coupons",
    channels: {
      push: ch("Special Offer", "Use {{coupon_code}} for {{coupon_discount}}!", {
        deepLink: "/products",
        icon: "tag",
      }),
      in_app: ch("Exclusive Coupon", "Code {{coupon_code}} — {{coupon_discount}}. Expires {{offer_expiry}}.", {
        deepLink: "/products",
        icon: "tag",
        cta: { label: "Shop Now", href: "/products" },
      }),
    },
  }),
  n({
    id: "cart-reminder",
    name: "Cart Reminder",
    category: "offers",
    emailTemplateId: "cart-reminder",
    channels: {
      push: ch("Cart Reminder", "You left items in your cart.", { deepLink: "/cart", icon: "shopping-cart" }),
      in_app: ch("Complete Your Order", "Items waiting in your cart.", {
        deepLink: "/cart",
        icon: "shopping-cart",
        cta: { label: "View Cart", href: "/cart" },
      }),
    },
  }),
  n({
    id: "support-reply",
    name: "Support Reply",
    category: "support",
    channels: {
      push: ch("Support Reply", "We've responded to your enquiry.", {
        deepLink: "/account/support",
        icon: "message-circle",
      }),
      in_app: ch("Support Update", "Our team has replied to your message.", {
        deepLink: "/account/support",
        icon: "message-circle",
        cta: { label: "View", href: "/account/support" },
      }),
    },
  }),
  n({
    id: "system-announcement",
    name: "System Announcement",
    category: "system",
    channels: {
      push: ch("BeyondBabyCo Update", "Important announcement from BeyondBabyCo.", {
        deepLink: "/",
        icon: "info",
        priority: "normal",
      }),
      in_app: ch("Announcement", "Important update from BeyondBabyCo.", {
        deepLink: "/",
        icon: "info",
      }),
    },
  }),
];

const NOTIFICATION_MAP = new Map(NOTIFICATION_TEMPLATES.map((t) => [t.id, t]));

export function getNotificationTemplate(id: string): MultiChannelNotification | undefined {
  return NOTIFICATION_MAP.get(id);
}

export function getNotificationsByCategory(category: NotificationCategory): MultiChannelNotification[] {
  return NOTIFICATION_TEMPLATES.filter((t) => t.category === category);
}

export function renderNotificationChannel(
  templateId: string,
  channel: keyof MultiChannelNotification["channels"],
  data?: Record<string, string>,
) {
  const template = getNotificationTemplate(templateId);
  if (!template?.channels[channel]) return null;
  const merged = { ...template.sampleData, ...data };
  const ch = template.channels[channel]!;
  const interpolate = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => merged[k] ?? `{{${k}}}`);
  return {
    title: interpolate(ch.title),
    body: interpolate(ch.body),
    cta: ch.cta ? { label: interpolate(ch.cta.label), href: interpolate(ch.cta.href) } : undefined,
    icon: ch.icon,
    deepLink: ch.deepLink ? interpolate(ch.deepLink) : undefined,
    priority: ch.priority,
  };
}
