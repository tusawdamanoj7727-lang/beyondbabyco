import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("products").list("", { limit: 1 });
    if (error) throw error;
    return NextResponse.json({ status: "ok", latencyMs: Date.now() - start });
  } catch (error) {
    return NextResponse.json(
      { status: "degraded", latencyMs: Date.now() - start, error: error instanceof Error ? error.message : "Unknown" },
      { status: 503 },
    );
  }
}
