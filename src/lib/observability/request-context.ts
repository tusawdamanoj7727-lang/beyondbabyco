import "server-only";

import { headers } from "next/headers";

import { generateRequestId } from "./request-id";

/** Read or create request ID from incoming headers (route handlers / server components). */
export async function getRequestContext(): Promise<{ requestId: string; correlationId: string }> {
  const h = await headers();
  const requestId = h.get("x-request-id") ?? generateRequestId();
  const correlationId = h.get("x-correlation-id") ?? requestId;
  return { requestId, correlationId };
}
