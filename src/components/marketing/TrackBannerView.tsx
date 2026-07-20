"use client";

import { useEffect } from "react";

/** Lightweight view beacon — no layout impact. */
export function TrackBannerView({ bannerId }: { bannerId: string }) {
  useEffect(() => {
    const key = `bbc_banner_view:${bannerId}`;
    let unique = true;
    try {
      if (sessionStorage.getItem(key)) unique = false;
      else sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }

    void fetch("/api/marketing/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subjectType: "banner",
        subjectId: bannerId,
        eventType: unique ? "unique_view" : "view",
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [bannerId]);

  return null;
}
