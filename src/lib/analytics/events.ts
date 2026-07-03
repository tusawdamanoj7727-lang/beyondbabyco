"use client";

/** Client-side analytics events — no-ops when providers are not loaded. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEventPayload = Record<string, string | number | boolean | undefined>;

function safeGtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

function safeFbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export function trackPageView(path: string, title?: string) {
  safeGtag("event", "page_view", {
    page_path: path,
    page_title: title,
    send_to: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  });
  safeFbq("track", "PageView");
}

export function trackViewItem(input: { itemId: string; itemName: string; price?: number; currency?: string }) {
  safeGtag("event", "view_item", {
    currency: input.currency ?? "INR",
    value: input.price,
    items: [{ item_id: input.itemId, item_name: input.itemName }],
  });
  safeFbq("track", "ViewContent", {
    content_ids: [input.itemId],
    content_name: input.itemName,
    value: input.price,
    currency: input.currency ?? "INR",
  });
}

export function trackBeginCheckout(input: { value: number; currency?: string; itemCount: number }) {
  safeGtag("event", "begin_checkout", {
    currency: input.currency ?? "INR",
    value: input.value,
    items_count: input.itemCount,
  });
  safeFbq("track", "InitiateCheckout", {
    value: input.value,
    currency: input.currency ?? "INR",
    num_items: input.itemCount,
  });
}

export function trackPurchase(input: {
  transactionId: string;
  value: number;
  currency?: string;
  itemCount?: number;
}) {
  safeGtag("event", "purchase", {
    transaction_id: input.transactionId,
    currency: input.currency ?? "INR",
    value: input.value,
    items_count: input.itemCount,
  });
  safeFbq("track", "Purchase", {
    value: input.value,
    currency: input.currency ?? "INR",
    num_items: input.itemCount,
  });
}

export function trackAddToCart(input: { itemId: string; itemName: string; price?: number; currency?: string }) {
  safeGtag("event", "add_to_cart", {
    currency: input.currency ?? "INR",
    value: input.price,
    items: [{ item_id: input.itemId, item_name: input.itemName }],
  });
  safeFbq("track", "AddToCart", {
    content_ids: [input.itemId],
    content_name: input.itemName,
    value: input.price,
    currency: input.currency ?? "INR",
  });
}

export function trackCustomEvent(name: string, payload?: AnalyticsEventPayload) {
  safeGtag("event", name, payload ?? {});
}
