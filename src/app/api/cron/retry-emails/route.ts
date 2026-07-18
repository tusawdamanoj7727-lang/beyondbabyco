import { jsonOk } from "@/lib/api/route-helpers";
import { dispatchOrderEmail } from "@/lib/email/dispatch";
import { logger } from "@/lib/observability/logger";
import { requireCronAuth } from "@/lib/security/cron-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const MAX_RETRY_BATCH = 40;

/**
 * Re-dispatch failed transactional emails (order_email_logs.status = failed).
 * Uses force=true so the sent guard is bypassed for explicit retries.
 */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  const supabase = createSupabaseServiceClient();
  const { data: rows, error } = await supabase
    .from("order_email_logs")
    .select("id, order_id, template_id, recipient, status, error_message")
    .eq("status", "failed")
    .order("sent_at", { ascending: true })
    .limit(MAX_RETRY_BATCH);

  if (error) {
    logger.error("cron.retry_emails.query_failed", { error: error.message });
    return jsonOk({ retried: 0, sent: 0, failed: 0, error: error.message });
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    if (!row.order_id || !row.template_id) {
      failed += 1;
      continue;
    }

    const isAdmin = row.template_id.startsWith("admin-");
    const result = await dispatchOrderEmail(row.order_id, row.template_id, {
      force: true,
      admin: isAdmin,
    });

    logger.info("cron.retry_emails.attempt", {
      logId: row.id,
      orderId: row.order_id,
      templateId: row.template_id,
      sent: result.sent,
      skipped: result.skipped,
      error: result.error ?? null,
    });

    if (result.sent) sent += 1;
    else if (result.error) failed += 1;
  }

  return jsonOk({
    retried: rows?.length ?? 0,
    sent,
    failed,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
