import { TICKER_ITEMS } from "@/lib/brand/copy";

const BLOCKED_TICKER_PATTERNS = [/i\s*am\s*god/i];

/** Normalize ticker lines — drop blocked legacy CMS text and fall back to brand copy. */
export function resolveTickerItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [...TICKER_ITEMS];

  const items = value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0 &&
      !BLOCKED_TICKER_PATTERNS.some((pattern) => pattern.test(item)),
  );

  return items.length > 0 ? items : [...TICKER_ITEMS];
}
