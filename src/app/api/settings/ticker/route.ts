import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ANNOUNCEMENT_TICKER_ITEMS, getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
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
    return NextResponse.json({ items: [...ANNOUNCEMENT_TICKER_ITEMS] });
  }

  return NextResponse.json({ items: getAnnouncementTickerItems(data?.value) });
}

export async function POST(req: Request) {
  try {
    await requirePermission(PERMISSIONS.CMS_MANAGE);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { items?: unknown };
  const items = getAnnouncementTickerItems(body.items);

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "ticker_items",
      value: items as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, items });
}
