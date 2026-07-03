import * as Sentry from "@sentry/nextjs";

import { logger } from "./logger";
import { getErrorTrackingStatus, getSelectedErrorTrackingProvider } from "@/lib/operations/error-tracking";

export interface ErrorTrackingContext {
  requestId?: string;
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorTrackingContext): void {
  logger.error("Captured exception", {
    requestId: context?.requestId,
    userId: context?.userId,
    error,
    provider: getSelectedErrorTrackingProvider(),
    ...context?.extra,
  });

  const status = getErrorTrackingStatus();
  if (!status.configured) return;

  if (status.provider === "sentry" && process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.userId ? { id: context.userId } : undefined,
    });
    return;
  }

  void forwardToProvider("exception", error, context, status.provider);
}

export function captureMessage(message: string, context?: ErrorTrackingContext): void {
  logger.warn(message, {
    requestId: context?.requestId,
    provider: getSelectedErrorTrackingProvider(),
    ...context?.extra,
  });

  const status = getErrorTrackingStatus();
  if (!status.configured) return;

  if (status.provider === "sentry" && process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level: "warning",
      tags: context?.tags,
      extra: context?.extra,
    });
    return;
  }

  void forwardToProvider("message", message, context, status.provider);
}

async function forwardToProvider(
  kind: "exception" | "message",
  payload: unknown,
  context: ErrorTrackingContext | undefined,
  provider: string,
): Promise<void> {
  try {
    if (provider === "better_stack" && (process.env.BETTER_STACK_DSN || process.env.ERROR_TRACKING_DSN)) {
      const dsn = process.env.BETTER_STACK_DSN || process.env.ERROR_TRACKING_DSN;
      await fetch(dsn!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: kind === "message" ? String(payload) : payload instanceof Error ? payload.message : "Exception",
          level: kind === "message" ? "warning" : "error",
          context: context?.extra,
          tags: context?.tags,
        }),
      }).catch(() => undefined);
      return;
    }
    if (provider === "logtail" && process.env.LOGTAIL_SOURCE_TOKEN) {
      await fetch("https://in.logtail.com/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LOGTAIL_SOURCE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: kind === "message" ? String(payload) : "Exception captured",
          level: kind === "message" ? "warn" : "error",
          ...context?.extra,
        }),
      }).catch(() => undefined);
    }
  } catch {
    // Graceful failure
  }
}

export function recordMetric(name: string, value: number, unit: "ms" | "count" = "ms"): void {
  logger.info("metric", { metric: name, value, unit });
}

export function triggerSampleError(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Sample errors are disabled in production");
  }
  const err = new Error("BeyondBabyCo ops sample error — safe to ignore");
  captureException(err, { tags: { source: "ops_sample" }, extra: { triggeredAt: new Date().toISOString() } });
  throw err;
}
