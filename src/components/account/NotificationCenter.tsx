"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Archive,
  ArchiveRestore,
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  MapPin,
  MessageCircle,
  Package,
  ShoppingCart,
  Tag,
  Truck,
  X,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import {
  activeNotifications,
  archiveNotification,
  archivedNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_CATEGORY_LABELS,
  unarchiveNotification,
  unreadCount,
  type CustomerNotification,
  type NotificationCategory,
} from "@/lib/storefront/notifications";
import { cn } from "@/lib/utils";
import { dialogOverlay, dialogPanel, focusRing, iconButton, transitionColorsFast } from "@/lib/design/ui";

const ICON_MAP: Record<string, LucideIcon> = {
  package: Package,
  truck: Truck,
  "map-pin": MapPin,
  "credit-card": CreditCard,
  tag: Tag,
  "shopping-cart": ShoppingCart,
  "message-circle": MessageCircle,
  info: Info,
  "alert-triangle": AlertTriangle,
  bell: Bell,
};

type FilterTab = NotificationCategory | "all" | "archived";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    refresh();
    window.addEventListener("bbc:notifications-updated", refresh);
    return () => window.removeEventListener("bbc:notifications-updated", refresh);
  }, []);

  const unread = unreadCount();
  const items = useMemo(() => {
    void tick;
    if (tab === "archived") return archivedNotifications();
    return activeNotifications(tab === "all" ? undefined : tab);
  }, [tab, tick]);

  const categories: FilterTab[] = ["all", "orders", "delivery", "payments", "offers", "account", "support", "system", "archived"];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className={cn(
            "relative inline-flex min-h-[44px] h-11 items-center gap-2 rounded-full border border-green-200 bg-white/90 px-4 text-sm font-medium text-green-800 shadow-sm",
            transitionColorsFast,
            "hover:bg-green-50",
            focusRing,
          )}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          Notifications
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terra-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-[100]", dialogOverlay)} />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            dialogPanel,
            "fixed right-4 top-24 z-[110] flex max-h-[min(85vh,560px)] w-[min(92vw,420px)] flex-col overflow-hidden outline-none",
          )}
        >
          <div className="flex items-center justify-between border-b border-green-100 px-4 py-3">
            <Dialog.Title className="font-heading font-bold text-green-900">Notifications</Dialog.Title>
            <div className="flex items-center gap-1">
              {unread > 0 && tab !== "archived" ? (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50",
                    transitionColorsFast,
                    focusRing,
                  )}
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark all read
                </button>
              ) : null}
              <Dialog.Close asChild>
                <button type="button" aria-label="Close notifications" className={cn(iconButton, focusRing)}>
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div
            className="flex gap-1 overflow-x-auto border-b border-green-100 px-2 py-2"
            role="tablist"
            aria-label="Notification categories"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={tab === cat}
                onClick={() => setTab(cat)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  transitionColorsFast,
                  focusRing,
                  tab === cat
                    ? "bg-green-800 text-cream-50"
                    : "text-green-700 hover:bg-green-50",
                )}
              >
                {cat === "all" ? "All" : cat === "archived" ? "Archived" : NOTIFICATION_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <ul className="flex-1 overflow-y-auto p-2" aria-live="polite">
            {items.length === 0 ? (
              <li className="px-4 py-12 text-center">
                <div className="mx-auto flex max-w-xs flex-col items-center">
                  <div className="rounded-full bg-green-50 p-4">
                    {tab === "archived" ? (
                      <Archive className="h-8 w-8 text-green-600/70" aria-hidden="true" />
                    ) : (
                      <Bell className="h-8 w-8 text-green-600/70" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-green-900">
                    {tab === "archived" ? "No archived notifications" : "All caught up"}
                  </p>
                  <p className="mt-1 text-xs text-green-700/70">
                    {tab === "archived"
                      ? "Archived notifications will appear here."
                      : "Order, delivery, and offer updates will show here."}
                  </p>
                </div>
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    item={n}
                    isArchived={tab === "archived"}
                    onRead={() => {
                      markNotificationRead(n.id);
                      if (n.href) window.location.href = n.href;
                    }}
                    onArchive={() => archiveNotification(n.id)}
                    onUnarchive={() => unarchiveNotification(n.id)}
                  />
                </li>
              ))
            )}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NotificationRow({
  item,
  isArchived,
  onRead,
  onArchive,
  onUnarchive,
}: {
  item: CustomerNotification;
  isArchived: boolean;
  onRead: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  const Icon = item.icon ? ICON_MAP[item.icon] ?? Bell : Bell;
  const priorityClass =
    item.priority === "urgent"
      ? "border-l-4 border-l-red-400"
      : item.priority === "high"
        ? "border-l-4 border-l-terra-500"
        : "";

  return (
    <div
      className={cn(
        "group flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/80",
        !item.read && !isArchived && "bg-white/90 shadow-sm",
        priorityClass,
      )}
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700"
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" className="w-full text-left" onClick={onRead}>
          <p className="text-sm font-semibold text-green-900">{item.title}</p>
          <p className="mt-0.5 text-xs text-green-700/80">{item.message}</p>
          <p className="mt-1 text-[10px] text-green-600/60">
            {NOTIFICATION_CATEGORY_LABELS[item.category]} · {new Date(item.createdAt).toLocaleString("en-IN")}
          </p>
        </button>
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {isArchived ? (
          <button
            type="button"
            aria-label="Restore notification"
            onClick={onUnarchive}
            className="rounded-lg p-1.5 text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Archive notification"
            onClick={onArchive}
            className="rounded-lg p-1.5 text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
