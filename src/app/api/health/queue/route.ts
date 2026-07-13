import { jsonOk } from "@/lib/api/route-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHealthCheckAuth } from "@/lib/security/health-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireHealthCheckAuth(request);
  if (denied) return denied;

  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const [email, whatsapp, push] = await Promise.all([
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
      supabase.from("whatsapp_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
      supabase.from("push_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    ]);

    return jsonOk({
      status: "ok",
      latencyMs: Date.now() - start,
      queues: {
        email: email.count ?? 0,
        whatsapp: whatsapp.count ?? 0,
        push: push.count ?? 0,
      },
    });
  } catch {
    return jsonOk({ status: "degraded", latencyMs: Date.now() - start });
  }
}
