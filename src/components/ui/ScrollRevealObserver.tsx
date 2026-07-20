"use client";

import { useEffect } from "react";

import {
  SCROLL_REVEAL_SELECTOR,
  prefersReducedMotion,
  revealAllScrollElements,
} from "@/lib/a11y/scroll-reveal";
import { isCoarsePointer } from "@/lib/a11y/coarse-pointer";

/** One-shot IntersectionObserver for CSS reveal classes (replaces scroll-linked view timelines). */
export default function ScrollRevealObserver() {
  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) {
      revealAllScrollElements(document);
      return;
    }

    let observer: IntersectionObserver | undefined;
    let mutation: MutationObserver | undefined;
    let cancelled = false;
    let pendingScan = false;

    const setup = () => {
      if (cancelled) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer?.unobserve(entry.target);
            }
          }
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -4% 0px",
        },
      );

      function observe(root: ParentNode) {
        root.querySelectorAll<HTMLElement>(SCROLL_REVEAL_SELECTOR).forEach((el) => {
          if (el.classList.contains("is-revealed") || el.dataset.revealObserved === "1") return;
          el.dataset.revealObserved = "1";
          observer!.observe(el);
        });
      }

      observe(document);

      mutation = new MutationObserver((records) => {
        if (pendingScan) return;
        let hasElements = false;
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element) {
              hasElements = true;
              break;
            }
          }
          if (hasElements) break;
        }
        if (!hasElements) return;
        pendingScan = true;
        requestAnimationFrame(() => {
          pendingScan = false;
          if (!cancelled) observe(document);
        });
      });
      mutation.observe(document.body, { childList: true, subtree: true });

      window.setTimeout(() => {
        if (!cancelled) observe(document);
      }, 400);
    };

    if (typeof requestIdleCallback !== "undefined") {
      const idleId = requestIdleCallback(setup, { timeout: 900 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
        observer?.disconnect();
        mutation?.disconnect();
      };
    }

    const timeoutId = window.setTimeout(setup, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      observer?.disconnect();
      mutation?.disconnect();
    };
  }, []);

  return null;
}
