/** Map homepage category titles to product browse URLs. */
export function categoryBrowseHref(title: string): string | null {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes("coming soon")) return null;

  const map: Record<string, string> = {
    "baby wipes": "/products?q=wipes",
    "baby care": "/products?q=baby+care",
    "bath & skin": "/products?q=bath",
    "skin care": "/products?q=skin",
  };

  return map[normalized] ?? `/products?q=${encodeURIComponent(title)}`;
}
