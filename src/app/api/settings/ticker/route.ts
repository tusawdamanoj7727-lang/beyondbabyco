import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { tickerUpdateBodySchema } from "@/lib/api/schemas";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ANNOUNCEMENT_TICKER_ITEMS, getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
import { handleApiError, jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "ticker_items")
    .maybeSingle();

  if (error) {
    return jsonOk({ items: [...ANNOUNCEMENT_TICKER_ITEMS] });
  }

  return jsonOk({ items: getAnnouncementTickerItems(data?.value) });
}

export async function POST(req: Request) {
  const auth = await requireStaffApi(PERMISSIONS.CMS_MANAGE);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(req, { schema: tickerUpdateBodySchema });
  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.status);
  }

  const items = getAnnouncementTickerItems(parsed.data.items);

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "ticker_items",
      value: items as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return handleApiError(error, "settings.ticker");

  logApiAction({
    action: "api.settings.ticker.update",
    entity: "site_settings",
    metadata: { itemCount: items.length },
  });

  return jsonOk({ items });
}
