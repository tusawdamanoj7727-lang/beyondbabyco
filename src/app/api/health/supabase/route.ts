import { handleApiError, jsonOk } from "@/lib/api/route-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireHealthCheckAuth } from "@/lib/security/health-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireHealthCheckAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) throw error;
    return jsonOk({ connected: true });
  } catch (error) {
    return handleApiError(error, "health.supabase");
  }
}
