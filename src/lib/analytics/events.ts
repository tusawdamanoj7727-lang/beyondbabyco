"use client";

import {
  getGoogleAdsAddToCartLabel,
  getGoogleAdsBeginCheckoutLabel,
  getGoogleAdsId,
  getGoogleAdsPurchaseLabel,
  getMetaPixelId,
  isGtmEnabled,
} from "@/lib/analytics/config";

/** Client-side analytics events — one centralized transport for GTM / GA4 / Meta / Clarity. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    dataLayer?: Record<string, unknown>[];
  }
}

type Primitive = string | number | boolean | null | undefined;
export type AnalyticsEventPayload = Record<string, Primitive>;

export type AnalyticsPageType = "homepage" | "collection" | "product" | "search" | "other";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  item_list_id?: string;
  item_list_name?: string;
  price?: number;
  quantity?: number;
  discount?: number;
  coupon?: string;
  currency?: string;
};

type EcommercePayload = {
  currency?: string;
  value?: number;
  coupon?: string;
  items?: AnalyticsItem[];
};

type AnalyticsEventInput = Record<string, unknown> & {
  ecommerce?: EcommercePayload;
};

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

function safeDataLayerPush(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

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

function safeClarityEvent(name: string) {
  if (typeof window !== "undefined" && typeof window.clarity === "function") {
    window.clarity("event", name);
  }
}

function sendGoogleAdsConversion(label: string | null, payload: { value?: number; currency?: string; transaction_id?: string }) {
  const adsId = getGoogleAdsId();
  if (!adsId || !label) return;
  const conversion = {
    send_to: `${adsId}/${label}`,
    value: payload.value,
    currency: payload.currency ?? "INR",
    transaction_id: payload.transaction_id,
  };
  // GTM mode: push for a GTM conversion tag; direct mode: gtag conversion.
  if (isGtmEnabled()) {
    safeDataLayerPush({ event: "ads_conversion", ...conversion });
    return;
  }
  safeGtag("event", "conversion", conversion);
}

function sendEvent(
  name: string,
  payload: AnalyticsEventInput = {},
  options?: {
    metaStandardEvent?: { name: string; payload?: Record<string, unknown> };
    clarityEvent?: string;
  },
) {
  const { ecommerce, ...rest } = payload;

  if (isGtmEnabled()) {
    safeDataLayerPush({
      event: name,
      page_path: currentPath(),
      ...rest,
      ...(ecommerce ? { ecommerce } : {}),
    });
  } else {
    safeGtag("event", name, {
      ...rest,
      ...(ecommerce ? { ...ecommerce } : {}),
    });
  }

  if (options?.metaStandardEvent) {
    const metaPayload = options.metaStandardEvent.payload ?? {};
    if (getMetaPixelId()) {
      safeFbq("track", options.metaStandardEvent.name, metaPayload);
    }
  }

  safeClarityEvent(options?.clarityEvent ?? name);
}

export function trackPageView(path: string, title?: string) {
  if (isGtmEnabled()) {
    safeDataLayerPush({
      event: "page_view",
      page_path: path,
      page_title: title,
    });
  } else {
    safeGtag("event", "page_view", {
      page_path: path,
      page_title: title,
    });
  }
  if (getMetaPixelId()) safeFbq("track", "PageView");
  safeClarityEvent("page_view");
}

export function trackPageTypeView(input: {
  type: AnalyticsPageType;
  path: string;
  title?: string;
  searchTerm?: string;
}) {
  const base = {
    page_type: input.type,
    page_path: input.path,
    page_title: input.title,
    search_term: input.searchTerm,
  } satisfies AnalyticsEventPayload;

  switch (input.type) {
    case "homepage":
      sendEvent("homepage_view", base, { clarityEvent: "homepage_view" });
      return;
    case "collection":
      sendEvent("collection_view", base, { clarityEvent: "collection_view" });
      return;
    case "product":
      sendEvent("product_view", base, { clarityEvent: "product_view" });
      return;
    case "search":
      sendEvent(
        "search",
        { ...base, search_term: input.searchTerm ?? "" },
        { clarityEvent: "search" },
      );
      return;
    default:
      sendEvent("page_type_view", base, { clarityEvent: "page_type_view" });
  }
}

export function trackViewItem(input: {
  currency?: string;
  value?: number;
  items: AnalyticsItem[];
  contentName?: string;
}) {
  sendEvent(
    "view_item",
    {
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
      },
    },
    {
      metaStandardEvent: {
        name: "ViewContent",
        payload: {
          content_ids: input.items.map((item) => item.item_id),
          content_name: input.contentName ?? input.items[0]?.item_name,
          value: input.value,
          currency: input.currency ?? "INR",
        },
      },
      clarityEvent: "view_item",
    },
  );
}

export function trackSearch(input: { searchTerm: string }) {
  sendEvent(
    "search",
    { search_term: input.searchTerm },
    { metaStandardEvent: { name: "Search", payload: { search_string: input.searchTerm } }, clarityEvent: "search" },
  );
}

export function trackViewCart(input: { currency?: string; value: number; items: AnalyticsItem[] }) {
  sendEvent(
    "view_cart",
    {
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
      },
    },
    { clarityEvent: "view_cart" },
  );
}

export function trackAddToCart(input: { currency?: string; value?: number; items: AnalyticsItem[] }) {
  sendEvent(
    "add_to_cart",
    {
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
      },
    },
    {
      metaStandardEvent: {
        name: "AddToCart",
        payload: {
          content_ids: input.items.map((item) => item.item_id),
          content_name: input.items[0]?.item_name,
          value: input.value,
          currency: input.currency ?? "INR",
        },
      },
      clarityEvent: "add_to_cart",
    },
  );
  sendGoogleAdsConversion(getGoogleAdsAddToCartLabel(), {
    value: input.value,
    currency: input.currency ?? "INR",
  });
}

export function trackRemoveFromCart(input: { currency?: string; value?: number; items: AnalyticsItem[] }) {
  sendEvent(
    "remove_from_cart",
    {
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
      },
    },
    { clarityEvent: "remove_from_cart" },
  );
}

export function trackWishlistAdd(input: { productId: string; productName: string }) {
  sendEvent(
    "wishlist_add",
    { item_id: input.productId, item_name: input.productName },
    { clarityEvent: "wishlist_add" },
  );
}

export function trackWishlistRemove(input: { productId: string; productName: string }) {
  sendEvent(
    "wishlist_remove",
    { item_id: input.productId, item_name: input.productName },
    { clarityEvent: "wishlist_remove" },
  );
}

export function trackBeginCheckout(input: { value: number; currency?: string; items: AnalyticsItem[]; coupon?: string }) {
  sendEvent(
    "begin_checkout",
    {
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
        coupon: input.coupon,
      },
    },
    {
      metaStandardEvent: {
        name: "InitiateCheckout",
        payload: {
          content_ids: input.items.map((item) => item.item_id),
          value: input.value,
          currency: input.currency ?? "INR",
          num_items: input.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
        },
      },
      clarityEvent: "begin_checkout",
    },
  );
  sendGoogleAdsConversion(getGoogleAdsBeginCheckoutLabel(), {
    value: input.value,
    currency: input.currency ?? "INR",
  });
}

export function trackAddShipping(input: {
  value: number;
  currency?: string;
  items: AnalyticsItem[];
  shippingTier?: string;
  coupon?: string;
}) {
  sendEvent(
    "add_shipping_info",
    {
      shipping_tier: input.shippingTier ?? "standard",
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
        coupon: input.coupon,
      },
    },
    { clarityEvent: "add_shipping_info" },
  );
}

export function trackAddPayment(input: {
  value: number;
  currency?: string;
  items: AnalyticsItem[];
  paymentType: string;
  coupon?: string;
}) {
  sendEvent(
    "add_payment_info",
    {
      payment_type: input.paymentType,
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
        coupon: input.coupon,
      },
    },
    {
      metaStandardEvent: {
        name: "AddPaymentInfo",
        payload: {
          content_ids: input.items.map((item) => item.item_id),
          value: input.value,
          currency: input.currency ?? "INR",
        },
      },
      clarityEvent: "add_payment_info",
    },
  );
}

export function trackCouponApplied(input: {
  coupon: string;
  value?: number;
  currency?: string;
  items?: AnalyticsItem[];
}) {
  sendEvent(
    "coupon_applied",
    {
      coupon: input.coupon,
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        coupon: input.coupon,
        items: input.items,
      },
    },
    { clarityEvent: "coupon_applied" },
  );
}

export function trackPurchase(input: {
  transactionId: string;
  value: number;
  currency?: string;
  items: AnalyticsItem[];
  coupon?: string;
  paymentType?: string;
}) {
  sendEvent(
    "purchase",
    {
      transaction_id: input.transactionId,
      payment_type: input.paymentType,
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
        coupon: input.coupon,
      },
    },
    {
      metaStandardEvent: {
        name: "Purchase",
        payload: {
          value: input.value,
          currency: input.currency ?? "INR",
          content_ids: input.items.map((item) => item.item_id),
          num_items: input.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
        },
      },
      clarityEvent: "purchase",
    },
  );
  sendGoogleAdsConversion(getGoogleAdsPurchaseLabel(), {
    value: input.value,
    currency: input.currency ?? "INR",
    transaction_id: input.transactionId,
  });
}

export function trackRefund(input: {
  transactionId: string;
  value: number;
  currency?: string;
  items?: AnalyticsItem[];
}) {
  sendEvent(
    "refund",
    {
      transaction_id: input.transactionId,
      ecommerce: {
        currency: input.currency ?? "INR",
        value: input.value,
        items: input.items,
      },
    },
    { clarityEvent: "refund" },
  );
}

export function trackNewsletterSubscribe(input: { location: string }) {
  sendEvent("newsletter_subscribe", { location: input.location }, { clarityEvent: "newsletter_subscribe" });
}

export function trackContactForm(input: { subject?: string }) {
  sendEvent(
    "contact_form_submit",
    { subject: input.subject },
    { metaStandardEvent: { name: "Contact" }, clarityEvent: "contact_form_submit" },
  );
}

export function trackLogin(input: { method: string }) {
  sendEvent("login", { method: input.method }, { clarityEvent: "login" });
}

export function trackSignup(input: { method: string }) {
  sendEvent(
    "sign_up",
    { method: input.method },
    { metaStandardEvent: { name: "CompleteRegistration" }, clarityEvent: "sign_up" },
  );
}

export function trackLogout(input?: { method?: string }) {
  sendEvent("logout", { method: input?.method ?? "password" }, { clarityEvent: "logout" });
}

export function trackAccountCreated(input: { method: string }) {
  sendEvent("account_created", { method: input.method }, { clarityEvent: "account_created" });
}

export function trackCustomEvent(name: string, payload?: AnalyticsEventInput) {
  sendEvent(name, payload, { clarityEvent: name });
}
