import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Lightweight connectivity probe against a known table. A genuine
    // network or configuration failure rejects and is handled below.
    await supabase.from("settings").select("key").limit(1);

    return NextResponse.json({ connected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ connected: false, error: message });
  }
}
