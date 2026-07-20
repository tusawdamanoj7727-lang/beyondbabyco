import { jsonOk } from "@/lib/api/route-helpers";
import { dispatchOrderEmail } from "@/lib/email/dispatch";
import { logger } from "@/lib/observability/logger";
import { requireCronAuth } from "@/lib/security/cron-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const MAX_RETRY_BATCH = 40;
const STALE_PENDING_MS = 5 * 60 * 1000;

/**
 * Re-dispatch failed / stuck-pending transactional emails.
 * Uses force=true so the sent guard is bypassed for explicit retries.
 */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  const supabase = createSupabaseServiceClient();
  const staleBefore = new Date(Date.now() - STALE_PENDING_MS).toISOString();

  const [{ data: failedRows, error: failedErr }, { data: pendingRows, error: pendingErr }] =
    await Promise.all([
      supabase
        .from("order_email_logs")
        .select("id, order_id, template_id, recipient, status, error_message")
        .eq("status", "failed")
        .order("sent_at", { ascending: true })
        .limit(MAX_RETRY_BATCH),
      supabase
        .from("order_email_logs")
        .select("id, order_id, template_id, recipient, status, error_message")
        .eq("status", "pending")
        .lt("sent_at", staleBefore)
        .order("sent_at", { ascending: true })
        .limit(MAX_RETRY_BATCH),
    ]);

  if (failedErr || pendingErr) {
    const message = failedErr?.message ?? pendingErr?.message ?? "query failed";
    logger.error("cron.retry_emails.query_failed", { error: message });
    return jsonOk({ retried: 0, sent: 0, failed: 0, error: message });
  }

  const seen = new Set<string>();
  const rows = [...(failedRows ?? []), ...(pendingRows ?? [])].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  }).slice(0, MAX_RETRY_BATCH);

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
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
      priorStatus: row.status,
      sent: result.sent,
      skipped: result.skipped,
      error: result.error ?? null,
    });

    if (result.sent) sent += 1;
    else if (result.error) failed += 1;
  }

  return jsonOk({
    retried: rows.length,
    sent,
    failed,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
