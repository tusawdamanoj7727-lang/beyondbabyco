import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 60 * 60 * 24 * 90; // 90 days

function signingSecret(): string {
  const dedicated =
    process.env.INVOICE_TOKEN_SECRET?.trim() || process.env.GUEST_CHECKOUT_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback =
    process.env.CRON_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!fallback) {
    throw new Error("Invoice token signing secret is not configured.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[invoices/token] Using fallback signing secret — set INVOICE_TOKEN_SECRET in production.",
    );
  }
  return fallback;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Issue a signed download token bound to an order id. */
export function issueInvoiceToken(
  orderId: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const exp = Date.now() + ttlMs;
  const body = Buffer.from(JSON.stringify({ orderId, exp }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/**
 * Stable guest invoice token derived from order placement time.
 * Same orderId + placedAt always yields the same token until expiry
 * (placedAt + 90 days) — avoids minting a new token on every track lookup.
 */
export function issueStableInvoiceToken(
  orderId: string,
  placedAt: string | Date | null | undefined,
): string {
  const baseMs =
    placedAt == null
      ? Date.now()
      : typeof placedAt === "string"
        ? new Date(placedAt).getTime()
        : placedAt.getTime();
  const start = Number.isFinite(baseMs) ? baseMs : Date.now();
  const exp = start + DEFAULT_TTL_MS;
  const body = Buffer.from(JSON.stringify({ orderId, exp }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify token matches orderId and has not expired. */
export function verifyInvoiceToken(token: string, orderId: string): boolean {
  if (!token || !orderId) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  if (!safeEqual(sig, sign(body))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      orderId?: string;
      exp?: number;
    };
    if (parsed.orderId !== orderId) return false;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
