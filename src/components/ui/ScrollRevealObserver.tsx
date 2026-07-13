"use client";

import { useEffect } from "react";

import {
  SCROLL_REVEAL_SELECTOR,
  prefersReducedMotion,
  revealAllScrollElements,
} from "@/lib/a11y/scroll-reveal";

/** One-shot IntersectionObserver for CSS reveal classes (replaces scroll-linked view timelines). */
export default function ScrollRevealObserver() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      revealAllScrollElements(document);
      return;
    }

    let observer: IntersectionObserver | undefined;
    let mutation: MutationObserver | undefined;
    let cancelled = false;

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
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
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
        for (const record of records) {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) observe(node);
          });
        }
      });
      mutation.observe(document.body, { childList: true, subtree: true });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const idleId = requestIdleCallback(setup, { timeout: 1200 });
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
