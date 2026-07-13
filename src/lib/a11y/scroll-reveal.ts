export const SCROLL_REVEAL_SELECTOR =
  ".scroll-reveal, .scroll-reveal-item, .scroll-reveal-slide-left, .scroll-reveal-slide-right, .scroll-reveal-scale-in, .accent-bar-animated";

/** Returns true when the user prefers reduced motion (SSR-safe). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Immediately mark all scroll-reveal elements as visible (skips animation). */
export function revealAllScrollElements(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(SCROLL_REVEAL_SELECTOR).forEach((el) => {
    el.classList.add("is-revealed");
    el.dataset.revealObserved = "1";
  });
}
