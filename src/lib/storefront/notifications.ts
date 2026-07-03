export type NotificationCategory =
  | "orders"
  | "offers"
  | "account"
  | "payments"
  | "support"
  | "delivery"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationType =
  | "order_placed"
  | "payment_success"
  | "payment_failed"
  | "shipment_dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "coupon"
  | "cart_reminder"
  | "account_update"
  | "support_reply"
  | "announcement";

export interface CustomerNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  href?: string;
  icon?: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

export const NOTIFICATIONS_KEY = "bbc_notifications_v2";

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  orders: "Orders",
  offers: "Offers",
  account: "Account",
  payments: "Payments",
  support: "Support",
  delivery: "Delivery",
  system: "System",
};

const TYPE_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
  order_placed: "orders",
  payment_success: "payments",
  payment_failed: "payments",
  shipment_dispatched: "delivery",
  in_transit: "delivery",
  out_for_delivery: "delivery",
  delivered: "delivery",
  delivery_failed: "delivery",
  coupon: "offers",
  cart_reminder: "offers",
  account_update: "account",
  support_reply: "support",
  announcement: "system",
};

export function categoryForType(type: NotificationType): NotificationCategory {
  return TYPE_CATEGORY_MAP[type];
}

function migrateNotification(raw: Record<string, unknown>): CustomerNotification | null {
  if (!raw.id || !raw.title || !raw.message) return null;
  const type = (raw.type as NotificationType) ?? "announcement";
  return {
    id: String(raw.id),
    type,
    category: (raw.category as NotificationCategory) ?? categoryForType(type),
    priority: (raw.priority as NotificationPriority) ?? "normal",
    title: String(raw.title),
    message: String(raw.message),
    href: raw.href ? String(raw.href) : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    read: Boolean(raw.read),
    archived: Boolean(raw.archived),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function readNotifications(): CustomerNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      return parsed.map(migrateNotification).filter(Boolean) as CustomerNotification[];
    }
    const legacy = localStorage.getItem("bbc_notifications_v1");
    if (legacy) {
      const items = (JSON.parse(legacy) as Record<string, unknown>[])
        .map(migrateNotification)
        .filter(Boolean) as CustomerNotification[];
      writeNotifications(items);
      return items;
    }
    return [];
  } catch {
    return [];
  }
}

export function writeNotifications(items: CustomerNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, 100)));
}

function dispatchUpdate() {
  window.dispatchEvent(new CustomEvent("bbc:notifications-updated"));
}

export function addNotification(
  notification: Omit<CustomerNotification, "id" | "read" | "archived" | "createdAt" | "category"> & {
    category?: NotificationCategory;
  },
) {
  const type = notification.type;
  const entry: CustomerNotification = {
    ...notification,
    category: notification.category ?? categoryForType(type),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...readNotifications()];
  writeNotifications(next);
  dispatchUpdate();
  return entry;
}

export function markNotificationRead(id: string) {
  const next = readNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  writeNotifications(next);
  dispatchUpdate();
}

export function markAllNotificationsRead() {
  const next = readNotifications().map((n) => (n.archived ? n : { ...n, read: true }));
  writeNotifications(next);
  dispatchUpdate();
}

export function archiveNotification(id: string) {
  const next = readNotifications().map((n) =>
    n.id === id ? { ...n, archived: true, read: true } : n,
  );
  writeNotifications(next);
  dispatchUpdate();
}

export function unarchiveNotification(id: string) {
  const next = readNotifications().map((n) => (n.id === id ? { ...n, archived: false } : n));
  writeNotifications(next);
  dispatchUpdate();
}

export function unreadCount(): number {
  return readNotifications().filter((n) => !n.read && !n.archived).length;
}

export function activeNotifications(category?: NotificationCategory): CustomerNotification[] {
  const items = readNotifications().filter((n) => !n.archived);
  if (!category) return items;
  return items.filter((n) => n.category === category);
}

export function archivedNotifications(): CustomerNotification[] {
  return readNotifications().filter((n) => n.archived);
}

/** Seed demo notifications for preview / first visit. */
export function seedDemoNotifications() {
  if (readNotifications().length > 0) return;
  const demos: Omit<CustomerNotification, "id" | "read" | "archived" | "createdAt">[] = [
    {
      type: "order_placed",
      category: "orders",
      priority: "high",
      title: "Order Confirmed",
      message: "Order BBC-2026-004821 for ₹847.00 is confirmed.",
      href: "/account/orders",
      icon: "package",
    },
    {
      type: "shipment_dispatched",
      category: "delivery",
      priority: "normal",
      title: "Order Shipped",
      message: "Your order is on its way via Delhivery.",
      href: "/account/orders",
      icon: "truck",
    },
    {
      type: "coupon",
      category: "offers",
      priority: "low",
      title: "Exclusive Offer",
      message: "Use BEYOND10 for 10% off your next order.",
      href: "/products",
      icon: "tag",
    },
  ];
  demos.forEach((d) => addNotification(d));
}
