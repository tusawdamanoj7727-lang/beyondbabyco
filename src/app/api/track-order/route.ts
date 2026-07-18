import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";

import {
  lookupGuestOrder,
  validateTrackOrderInput,
  TRACK_LOOKUP_GENERIC_ERROR,
} from "@/lib/orders/guest-track";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/track-order
 * Body: { orderNumber: string, email: string }
 *
 * Requires BOTH order number and checkout email.
 * Rate-limited per IP (and tighter per email+IP) to resist brute force.
 */
export async function POST(request: NextRequest) {
  const ipLimited = checkRateLimit(request, {
    windowMs: 60_000,
    max: 8,
    keyPrefix: "track-order",
  });
  if (ipLimited) return ipLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = (body ?? {}) as { orderNumber?: string; email?: string };
  const validated = validateTrackOrderInput(raw);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", fieldErrors: validated.fieldErrors },
      { status: 400 },
    );
  }

  const emailHash = createHash("sha256").update(validated.email).digest("hex").slice(0, 16);
  const emailLimited = checkRateLimit(request, {
    windowMs: 15 * 60_000,
    max: 15,
    keyPrefix: `track-order-em:${emailHash}`,
  });
  if (emailLimited) return emailLimited;

  const result = await lookupGuestOrder({
    orderNumber: validated.orderNumber,
    email: validated.email,
  });

  if (!result.ok) {
    if (result.code === "server_error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(
      { error: result.error || TRACK_LOOKUP_GENERIC_ERROR },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, order: result.order }, { status: 200 });
}
