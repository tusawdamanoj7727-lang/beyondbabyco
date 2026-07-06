import type { CSSProperties } from "react";

export type RevealVariant = "fadeUp" | "slideLeft" | "slideRight" | "scaleIn";

const scrollClasses: Record<RevealVariant, string> = {
  fadeUp: "scroll-reveal-item",
  slideLeft: "scroll-reveal-slide-left",
  slideRight: "scroll-reveal-slide-right",
  scaleIn: "scroll-reveal-scale-in",
};

const mountClasses: Record<RevealVariant, string> = {
  fadeUp: "animate-fade-in-up",
  slideLeft: "animate-slide-in-left",
  slideRight: "animate-slide-in-right",
  scaleIn: "animate-scale-in",
};

export function revealClassName(variant: RevealVariant, viewport: boolean): string {
  return viewport ? scrollClasses[variant] : mountClasses[variant];
}

/** Delay in seconds (matches existing Reveal / MotionSection API). */
export function revealDelayStyle(delaySec: number): CSSProperties | undefined {
  if (delaySec <= 0) return undefined;
  return { animationDelay: `${delaySec * 1000}ms` };
}
