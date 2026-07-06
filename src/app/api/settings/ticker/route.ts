import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TICKER_ITEMS } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function parseTickerItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [...TICKER_ITEMS];
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : [...TICKER_ITEMS];
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "ticker_items")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ items: [...TICKER_ITEMS] });
  }

  return NextResponse.json({ items: parseTickerItems(data?.value) });
}

export async function POST(req: Request) {
  try {
    await requirePermission(PERMISSIONS.CMS_MANAGE);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { items?: unknown };
  const items = parseTickerItems(body.items);

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
