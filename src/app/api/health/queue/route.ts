import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const [email, whatsapp, push] = await Promise.all([
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
      supabase.from("whatsapp_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
      supabase.from("push_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    ]);

    return NextResponse.json({
      status: "ok",
      latencyMs: Date.now() - start,
      queues: {
        email: email.count ?? 0,
        whatsapp: whatsapp.count ?? 0,
        push: push.count ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ status: "degraded", latencyMs: Date.now() - start, detail: "Queue tables unavailable" });
  }
}
