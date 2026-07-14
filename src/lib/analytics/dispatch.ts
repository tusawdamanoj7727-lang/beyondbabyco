"use client";

import { getGa4MeasurementId, getGtmContainerId } from "@/lib/analytics/config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export type AnalyticsEventPayload = Record<string, string | number | boolean | undefined>;

type MetaEventPayload = Record<string, unknown>;

type DispatchChannel = "gtm" | "ga4" | "none";

function getDispatchChannel(): DispatchChannel {
  if (getGtmContainerId()) return "gtm";
  if (getGa4MeasurementId()) return "ga4";
  return "none";
}

function pushDataLayer(payload: Record<string, unknown>) {
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

/** Session-scoped dedup — returns false when this key already fired. */
export function shouldFireOnce(dedupKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storageKey = `bbc_analytics:${dedupKey}`;
    if (sessionStorage.getItem(storageKey)) return false;
    sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}

export function dispatchAnalyticsEvent(
  eventName: string,
  payload: AnalyticsEventPayload = {},
  options?: { dedupKey?: string; ga4EventName?: string },
) {
  if (typeof window === "undefined") return;
  if (options?.dedupKey && !shouldFireOnce(options.dedupKey)) return;

  const channel = getDispatchChannel();
  const ga4Name = options?.ga4EventName ?? eventName;

  if (channel === "gtm") {
    pushDataLayer({ event: eventName, ...payload });
    return;
  }

  if (channel === "ga4") {
    safeGtag("event", ga4Name, payload);
  }
}

export function dispatchPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;

  const channel = getDispatchChannel();
  const ga4Id = getGa4MeasurementId();

  if (channel === "gtm") {
    pushDataLayer({
      event: "page_view",
      page_path: path,
      page_title: title,
    });
    return;
  }

  if (channel === "ga4" && ga4Id) {
    safeGtag("event", "page_view", {
      page_path: path,
      page_title: title,
      send_to: ga4Id,
    });
  }
}

export function dispatchMetaEvent(
  eventName: string,
  payload?: MetaEventPayload,
  dedupKey?: string,
) {
  if (dedupKey && !shouldFireOnce(`meta:${dedupKey}`)) return;
  safeFbq("track", eventName, payload ?? {});
}
