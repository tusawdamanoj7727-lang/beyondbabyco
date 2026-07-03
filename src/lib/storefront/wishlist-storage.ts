export const WISHLIST_STORAGE_KEY = "bbc_wishlist_v1";

export function readGuestWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeGuestWishlistIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
}

export function mergeWishlistIds(local: string[], remote: string[]): string[] {
  return [...new Set([...remote, ...local])];
}
