import { NextResponse } from "next/server";

import { getDelhiveryConfig } from "@/lib/delhivery/config";
import { delhiveryWebhookSchema } from "@/lib/delhivery/schemas";
import { processDelhiveryWebhook } from "@/lib/delhivery/service";
import { logger } from "@/lib/observability/logger";
import { verifyDelhiveryWebhookToken } from "@/lib/security/webhook-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getDelhiveryConfig();

  if (!verifyDelhiveryWebhookToken(request, config.webhookSecret)) {
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
    const status = result.error?.includes("not found") ? 404 : 422;
    const error = status === 404 ? "Not found" : "Invalid webhook payload.";
    return NextResponse.json({ ok: false, error }, { status });
  }

  logger.info("delhivery.webhook.processed", { data: result.data });
  return NextResponse.json({ ok: true, data: result.data ?? { received: true } });
}
