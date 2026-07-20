"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { isCoarsePointer } from "@/lib/a11y/coarse-pointer";

/** Non-critical UI — deferred to shrink the root layout client bundle. */
const ScrollRevealObserverImpl = dynamic(
  () => import("@/components/ui/ScrollRevealObserver"),
  { ssr: false },
);

const WhatsAppButtonImpl = dynamic(
  () => import("@/components/ui/WhatsAppButton").then((m) => ({ default: m.WhatsAppButton })),
  { ssr: false },
);

const AppToasterImpl = dynamic(
  () => import("@/components/ui/AppToaster").then((m) => ({ default: m.AppToaster })),
  { ssr: false },
);

/** Skip downloading scroll-reveal JS on phones — CSS already reveals all elements. */
export function ScrollRevealObserver() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isCoarsePointer()) setEnabled(true);
  }, []);

  if (!enabled) return null;
  return <ScrollRevealObserverImpl />;
}

/** Mount WhatsApp FAB after first interaction or idle — not on critical path. */
export function WhatsAppButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const onInteract = () => enable();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId = 0;
    let timeoutId = 0;
    if (typeof g.requestIdleCallback === "function") {
      idleId = g.requestIdleCallback(enable, { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(enable, 2500);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
      if (idleId && typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [ready]);

  if (!ready) return null;
  return <WhatsAppButtonImpl />;
}

/** Mount toaster after first interaction or idle — toasts only needed post-action. */
export function AppToaster() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const onInteract = () => enable();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId = 0;
    let timeoutId = 0;
    if (typeof g.requestIdleCallback === "function") {
      idleId = g.requestIdleCallback(enable, { timeout: 3000 });
    } else {
      timeoutId = window.setTimeout(enable, 1500);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId && typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [ready]);

  if (!ready) return null;
  return <AppToasterImpl />;
}

const AnalyticsRootImpl = dynamic(
  () => import("@/components/analytics/AnalyticsRoot"),
  { ssr: false },
);

/** Mount analytics after first interaction or idle — never on the LCP critical path. */
export function AnalyticsRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const onInteract = () => enable();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId = 0;
    let timeoutId = 0;
    if (typeof g.requestIdleCallback === "function") {
      idleId = g.requestIdleCallback(enable, { timeout: 5000 });
    } else {
      timeoutId = window.setTimeout(enable, 3500);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
      if (idleId && typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [ready]);

  if (!ready) return null;
  return <AnalyticsRootImpl />;
}
