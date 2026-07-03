export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

/** Edge-safe UUID (Web Crypto API). */
export function generateRequestId(): string {
  return globalThis.crypto.randomUUID();
}

export function attachRequestHeaders(
  responseHeaders: Headers,
  requestId: string,
  correlationId?: string,
): void {
  responseHeaders.set(REQUEST_ID_HEADER, requestId);
  responseHeaders.set(CORRELATION_ID_HEADER, correlationId ?? requestId);
}
