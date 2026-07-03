"use client";

import { useEffect } from "react";

const STORAGE_KEY = "bbc_recently_viewed";
const MAX_ITEMS = 8;

export function recordProductView(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readRecentlyViewedIds(excludeId?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return excludeId ? ids.filter((id) => id !== excludeId) : ids;
  } catch {
    return [];
  }
}

export default function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    recordProductView(productId);
  }, [productId]);

  return null;
}
