"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "bbc_popup_dismissed:";

function frequencyKey(slot: StorefrontCampaignSlot) {
  return `${STORAGE_PREFIX}${slot.slot}:${slot.headline}`;
}

/**
 * Admin-scheduled marketing popup (welcome / festival / coupon).
 * Delay + once-per-session dismissal; exit-intent on desktop only.
 */
export default function CampaignPopup({
  slot,
  delayMs = 4500,
  enableExitIntent = true,
}: {
  slot: StorefrontCampaignSlot;
  delayMs?: number;
  enableExitIntent?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(frequencyKey(slot))) return;
    } catch {
      /* ignore */
    }

    let opened = false;
    const openOnce = () => {
      if (opened) return;
      opened = true;
      setOpen(true);
    };

    const timer = window.setTimeout(openOnce, delayMs);

    const onExit = (e: MouseEvent) => {
      if (!enableExitIntent) return;
      if (e.clientY > 12) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
      openOnce();
    };

    document.addEventListener("mouseout", onExit);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onExit);
    };
  }, [slot, delayMs, enableExitIntent]);

  if (!open) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(frequencyKey(slot), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={slot.headline || "Promotion"}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close overlay" onClick={dismiss} />
      <div
        className={cn(
          "relative w-full max-w-md rounded-3xl border border-cream-200 bg-cream-50 p-6 shadow-2xl sm:p-8",
        )}
        style={{ backgroundColor: slot.theme.background || undefined }}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm text-green-800/70 hover:bg-black/5"
          aria-label="Dismiss"
        >
          ✕
        </button>
        <p className="font-display text-xl font-semibold text-green-950" style={{ color: slot.theme.primary }}>
          {slot.headline}
        </p>
        {slot.subheading ? <p className="mt-2 text-sm text-green-900/80">{slot.subheading}</p> : null}
        <Link
          href={slot.ctaUrl || slot.targetUrl || "/products"}
          onClick={dismiss}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-green-800 px-5 text-sm font-semibold text-cream-50 transition hover:bg-green-900"
          style={slot.theme.accent ? { backgroundColor: slot.theme.accent } : undefined}
        >
          {slot.ctaLabel || "Shop now"}
        </Link>
      </div>
    </div>
  );
}
