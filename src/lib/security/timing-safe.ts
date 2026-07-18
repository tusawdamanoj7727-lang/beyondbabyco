import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string equality for secrets/tokens.
 * Pads to equal length so comparison does not short-circuit on length.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ba.length, bb.length, 1);
  const pa = Buffer.alloc(len + 1);
  const pb = Buffer.alloc(len + 1);
  pa[0] = Math.min(ba.length, 255);
  pb[0] = Math.min(bb.length, 255);
  ba.copy(pa, 1, 0, len);
  bb.copy(pb, 1, 0, len);
  return timingSafeEqual(pa, pb);
}
