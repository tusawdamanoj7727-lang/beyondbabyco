import { TICKER_ITEMS } from "./copy";
import { resolveTickerItems } from "./ticker-items";

/**
 * Canonical announcement ticker lines for every storefront page.
 * Always sanitizes CMS/DB input — blocked legacy test strings fall back to brand copy.
 */
export function getAnnouncementTickerItems(source?: unknown): readonly string[] {
  return resolveTickerItems(source ?? TICKER_ITEMS);
}

/** Default ticker payload — use for SSR, API fallbacks, and admin previews. */
export const ANNOUNCEMENT_TICKER_ITEMS = getAnnouncementTickerItems();
