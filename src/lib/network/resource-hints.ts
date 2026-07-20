/** Resolve Supabase storage origin for preconnect (if configured). */
export function getSupabaseOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || url.includes("your-project")) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Origins worth preconnecting on the storefront (deduped).
 *  Analytics origins are intentionally excluded — they compete with LCP bandwidth.
 */
export function getPreconnectOrigins(): string[] {
  const origins = new Set<string>();
  const supabase = getSupabaseOrigin();
  if (supabase) origins.add(supabase);
  return [...origins];
}
