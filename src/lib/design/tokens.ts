/**
 * Phase 11.1 — Premium design system tokens (programmatic).
 * CSS custom properties live in globals.css; use these for TS/JS contexts.
 */

export const FONT_HEADING =
  "var(--font-montserrat), Montserrat, 'Helvetica Neue', Helvetica, sans-serif";

export const FONT_BODY = "'Helvetica Neue', Helvetica, sans-serif";

/** 4px base spacing scale */
export const SPACE = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  section: "clamp(4rem, 8vw, 7.5rem)",
} as const;

export const RADIUS = {
  card: "24px",
  button: "9999px",
  input: "24px",
} as const;

export const TYPOGRAPHY = {
  hero: "text-hero",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  cardTitle: "text-card-title",
  label: "text-label",
  body: "text-body",
  caption: "text-caption",
  eyebrow: "text-eyebrow",
} as const;

export const ICON = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  stroke: "stroke-[1.75]",
} as const;
