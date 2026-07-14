import {
  captureException,
  captureMessage,
  type ErrorTrackingContext,
} from "./error-tracking";

export type OperationalDomain =
  | "checkout"
  | "razorpay"
  | "coupon"
  | "inventory"
  | "email"
  | "webhook"
  | "cron";

export interface OperationalErrorContext extends ErrorTrackingContext {
  operation?: string;
}

export function inferOperationalDomain(context: string): OperationalDomain | undefined {
  const key = context.toLowerCase();
  if (key.includes("razorpay") || key === "verify-payment") return "razorpay";
  if (key.includes("checkout") || key.includes("payment")) return "checkout";
  if (key.includes("coupon")) return "coupon";
  if (key.includes("inventory") || key.includes("reservation")) return "inventory";
  if (key.includes("email") || key.includes("smtp")) return "email";
  if (key.includes("webhook") || key.includes("delhivery.webhook")) return "webhook";
  if (key.includes("cron")) return "cron";
  return undefined;
}

function withDomainTags(
  domain: OperationalDomain,
  context?: OperationalErrorContext,
): ErrorTrackingContext {
  return {
    ...context,
    tags: {
      ...context?.tags,
      domain,
      operation: context?.operation ?? domain,
    },
  };
}

/** Capture an exception tagged by commerce/ops domain for Sentry filtering. */
export function captureOperationalError(
  domain: OperationalDomain,
  error: unknown,
  context?: OperationalErrorContext,
): void {
  captureException(error, withDomainTags(domain, context));
}

/** Capture a non-throwing operational failure (validation, webhook reject, etc.). */
export function captureOperationalFailure(
  domain: OperationalDomain,
  message: string,
  context?: OperationalErrorContext,
): void {
  captureMessage(message, withDomainTags(domain, context));
}

/** Infer domain from API route context string (e.g. `cron.expire-reservations`). */
export function captureApiError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  const domain = inferOperationalDomain(context) ?? "checkout";
  captureOperationalError(domain, error, {
    operation: context,
    extra,
  });
}
