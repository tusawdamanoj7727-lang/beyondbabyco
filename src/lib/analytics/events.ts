"use client";

import {
  dispatchAnalyticsEvent,
  dispatchMetaEvent,
  dispatchPageView,
  type AnalyticsEventPayload,
} from "@/lib/analytics/dispatch";

export type { AnalyticsEventPayload };

const CURRENCY = "INR";

export function trackPageView(path: string, title?: string) {
  dispatchPageView(path, title);
  dispatchMetaEvent("PageView", undefined, `page_view:${path}`);
}

export function trackProductView(input: {
  itemId: string;
  itemName: string;
  price?: number;
  currency?: string;
}) {
  const payload: AnalyticsEventPayload = {
    item_id: input.itemId,
    item_name: input.itemName,
    currency: input.currency ?? CURRENCY,
    value: input.price,
  };

  dispatchAnalyticsEvent("product_view", payload, {
    dedupKey: `product_view:${input.itemId}`,
    ga4EventName: "view_item",
  });

  dispatchMetaEvent(
    "ViewContent",
    {
      content_ids: [input.itemId],
      content_name: input.itemName,
      value: input.price,
      currency: input.currency ?? CURRENCY,
    },
    `product_view:${input.itemId}`,
  );
}

export function trackSearch(input: { searchTerm: string; resultCount?: number }) {
  const term = input.searchTerm.trim();
  if (!term) return;

  dispatchAnalyticsEvent(
    "search",
    {
      search_term: term,
      result_count: input.resultCount,
    },
    { dedupKey: `search:${term}` },
  );

  dispatchMetaEvent("Search", { search_string: term }, `search:${term}`);
}

export function trackAddToCart(input: {
  itemId: string;
  itemName: string;
  price?: number;
  quantity?: number;
  currency?: string;
}) {
  const payload: AnalyticsEventPayload = {
    item_id: input.itemId,
    item_name: input.itemName,
    currency: input.currency ?? CURRENCY,
    value: input.price,
    quantity: input.quantity ?? 1,
  };

  dispatchAnalyticsEvent("add_to_cart", payload, { ga4EventName: "add_to_cart" });

  dispatchMetaEvent("AddToCart", {
    content_ids: [input.itemId],
    content_name: input.itemName,
    value: input.price,
    currency: input.currency ?? CURRENCY,
  });
}

export function trackRemoveFromCart(input: {
  itemId: string;
  itemName: string;
  price?: number;
  quantity?: number;
  currency?: string;
}) {
  dispatchAnalyticsEvent(
    "remove_from_cart",
    {
      item_id: input.itemId,
      item_name: input.itemName,
      currency: input.currency ?? CURRENCY,
      value: input.price,
      quantity: input.quantity ?? 1,
    },
    { ga4EventName: "remove_from_cart" },
  );
}

export function trackCoupon(input: {
  couponCode: string;
  discountAmount?: number;
  currency?: string;
}) {
  dispatchAnalyticsEvent("coupon", {
    coupon: input.couponCode,
    currency: input.currency ?? CURRENCY,
    value: input.discountAmount,
  });
}

export function trackCheckout(input: { value: number; itemCount: number; currency?: string }) {
  dispatchAnalyticsEvent(
    "checkout",
    {
      currency: input.currency ?? CURRENCY,
      value: input.value,
      items_count: input.itemCount,
    },
    {
      dedupKey: "checkout:session",
      ga4EventName: "begin_checkout",
    },
  );

  dispatchMetaEvent(
    "InitiateCheckout",
    {
      value: input.value,
      currency: input.currency ?? CURRENCY,
      num_items: input.itemCount,
    },
    "checkout:session",
  );
}

export function trackPaymentSuccess(input: {
  orderId: string;
  value: number;
  itemCount?: number;
  currency?: string;
}) {
  dispatchAnalyticsEvent(
    "payment_success",
    {
      transaction_id: input.orderId,
      currency: input.currency ?? CURRENCY,
      value: input.value,
      items_count: input.itemCount,
    },
    { dedupKey: `payment_success:${input.orderId}` },
  );
}

export function trackPaymentFailure(input: {
  orderId?: string;
  reason?: string;
  value?: number;
  currency?: string;
}) {
  const dedupKey = input.orderId
    ? `payment_failure:${input.orderId}:${input.reason ?? "unknown"}`
    : undefined;

  dispatchAnalyticsEvent(
    "payment_failure",
    {
      transaction_id: input.orderId,
      reason: input.reason,
      currency: input.currency ?? CURRENCY,
      value: input.value,
    },
    dedupKey ? { dedupKey } : undefined,
  );
}

export function trackCod(input: {
  orderId: string;
  value: number;
  itemCount?: number;
  currency?: string;
}) {
  dispatchAnalyticsEvent(
    "cod",
    {
      transaction_id: input.orderId,
      currency: input.currency ?? CURRENCY,
      value: input.value,
      items_count: input.itemCount,
    },
    { dedupKey: `cod:${input.orderId}` },
  );
}

export function trackAccountCreated(input?: { method?: string }) {
  dispatchAnalyticsEvent(
    "account_created",
    { method: input?.method ?? "email" },
    { dedupKey: `account_created:${input?.method ?? "email"}`, ga4EventName: "sign_up" },
  );

  dispatchMetaEvent("CompleteRegistration", {}, `account_created:${input?.method ?? "email"}`);
}

export function trackLogin(input?: { method?: string }) {
  dispatchAnalyticsEvent(
    "login",
    { method: input?.method ?? "email" },
    { ga4EventName: "login" },
  );
}

export function trackLogout() {
  dispatchAnalyticsEvent("logout", {}, { ga4EventName: "logout" });
}

export function trackOrderCompleted(input: {
  transactionId: string;
  value: number;
  itemCount?: number;
  currency?: string;
  paymentMethod?: string;
}) {
  const payload: AnalyticsEventPayload = {
    transaction_id: input.transactionId,
    currency: input.currency ?? CURRENCY,
    value: input.value,
    items_count: input.itemCount,
    payment_method: input.paymentMethod,
  };

  dispatchAnalyticsEvent("order_completed", payload, {
    dedupKey: `order_completed:${input.transactionId}`,
    ga4EventName: "purchase",
  });

  dispatchMetaEvent(
    "Purchase",
    {
      value: input.value,
      currency: input.currency ?? CURRENCY,
      num_items: input.itemCount,
    },
    `order_completed:${input.transactionId}`,
  );
}

/** @deprecated Use trackCheckout — kept for gradual migration. */
export function trackBeginCheckout(input: { value: number; currency?: string; itemCount: number }) {
  trackCheckout({ value: input.value, itemCount: input.itemCount, currency: input.currency });
}

/** @deprecated Use trackOrderCompleted — kept for gradual migration. */
export function trackPurchase(input: {
  transactionId: string;
  value: number;
  currency?: string;
  itemCount?: number;
}) {
  trackOrderCompleted({
    transactionId: input.transactionId,
    value: input.value,
    itemCount: input.itemCount,
    currency: input.currency,
  });
}

/** @deprecated Use trackProductView */
export function trackViewItem(input: { itemId: string; itemName: string; price?: number; currency?: string }) {
  trackProductView(input);
}

export function trackCustomEvent(name: string, payload?: AnalyticsEventPayload) {
  dispatchAnalyticsEvent(name, payload ?? {});
}
