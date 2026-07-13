const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

/** Trap Tab / Shift+Tab within a dialog container. */
export function handleFocusTrap(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;

  const focusables = getFocusableElements(container);
  if (focusables.length === 0) return;

  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Lock document body scroll; returns a cleanup function. */
export function lockBodyScroll(): () => void {
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev;
  };
}
