"use client";

import { useEffect, useState } from "react";

/** Hydration-safe coarse/mobile detection for client-only UX branches. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const sync = () => setCoarse(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return coarse;
}
