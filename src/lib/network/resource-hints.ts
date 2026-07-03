import { getClarityProjectId, getGa4MeasurementId } from "@/lib/analytics/config";

export function getSupabaseOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || url.includes("your-project")) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Origins worth preconnecting on the storefront (deduped). */
export function getPreconnectOrigins(): string[] {
  const origins = new Set<string>();
  const supabase = getSupabaseOrigin();
  if (supabase) origins.add(supabase);
  if (getGa4MeasurementId()) origins.add("https://www.googletagmanager.com");
  if (getClarityProjectId()) origins.add("https://www.clarity.ms");
  return [...origins];
}
