import "server-only";

import { captureException } from "@/lib/observability/error-tracking";
import { logger } from "@/lib/observability/logger";

export type ProductLoadFailureLog = {
  slug: string;
  query: string;
  httpStatus?: number;
  responseBody?: unknown;
  returnedData?: unknown;
  errorMessage: string;
  stack?: string;
};

export function logProductLoadFailure(details: ProductLoadFailureLog): void {
  const err = new Error(details.errorMessage);
  logger.error("storefront.product.load_failed", {
    slug: details.slug,
    query: details.query,
    httpStatus: details.httpStatus,
    responseBody: details.responseBody,
    returnedData: details.returnedData,
    stack: details.stack ?? err.stack,
  });
  captureException(err, {
    tags: { slug: details.slug, surface: "product-detail" },
    extra: {
      query: details.query,
      httpStatus: details.httpStatus,
      responseBody: details.responseBody,
      returnedData: details.returnedData,
    },
  });
}

export function logProductLoadSuccess(slug: string, productId: string): void {
  logger.info("storefront.product.load_ok", { slug, productId });
}

/** Normalize Supabase Postgrest errors for structured logs. */
export function supabaseErrorBody(error: {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}): Record<string, unknown> {
  return {
    message: error.message,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}
