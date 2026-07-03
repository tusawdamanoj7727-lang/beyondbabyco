import { NextResponse } from "next/server";

import { getDelhiveryConfig } from "@/lib/delhivery/config";
import { delhiveryWebhookSchema } from "@/lib/delhivery/schemas";
import { processDelhiveryWebhook } from "@/lib/delhivery/service";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

function verifyWebhook(request: Request): boolean {
  const config = getDelhiveryConfig();
  if (!config.webhookSecret) {
    return process.env.NODE_ENV !== "production";
  }
  const token = request.headers.get("x-delhivery-webhook-token");
  return token === config.webhookSecret;
}

export async function POST(request: Request) {
  if (!verifyWebhook(request)) {
    logger.warn("delhivery.webhook.unauthorized");
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = delhiveryWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    logger.warn("delhivery.webhook.invalid_payload", { issues: parsed.error.issues.length });
    return NextResponse.json({ ok: false, error: "Invalid webhook payload." }, { status: 422 });
  }

  const result = await processDelhiveryWebhook(parsed.data as Record<string, unknown>);

  if (!result.ok) {
    logger.error("delhivery.webhook.process_failed", { error: result.error });
    // 200 for unknown waybill avoids infinite retries; 404 when shipment missing
    const status = result.error?.includes("not found") ? 404 : 422;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  logger.info("delhivery.webhook.processed", { data: result.data });
  return NextResponse.json({ ok: true, data: result.data });
}
