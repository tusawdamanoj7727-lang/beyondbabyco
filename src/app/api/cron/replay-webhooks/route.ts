import { jsonOk } from "@/lib/api/route-helpers";
import { replayWebhook } from "@/lib/admin/payment-engine";
import { logger } from "@/lib/observability/logger";
import { requireCronAuth } from "@/lib/security/cron-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const MAX_BATCH = 25;

/**
 * Replay unprocessed payment webhooks so failed captures are recovered without
 * permanently acknowledging Razorpay on the first failure.
 */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  const supabase = createSupabaseServiceClient();
  const { data: rows, error } = await supabase
    .from("payment_webhooks")
    .select("id, event_type, gateway_id, error, created_at")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(MAX_BATCH);

  if (error) {
    logger.error("cron.replay_webhooks.query_failed", { error: error.message });
    return jsonOk({ candidates: 0, recovered: 0, failed: 0, error: error.message });
  }

  let recovered = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    const result = await replayWebhook(row.id);
    logger.info("cron.replay_webhooks.attempt", {
      webhookId: row.id,
      eventType: row.event_type,
      ok: result.ok,
      error: result.error,
    });
    if (result.ok) recovered += 1;
    else failed += 1;
  }

  return jsonOk({
    candidates: rows?.length ?? 0,
    recovered,
    failed,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
