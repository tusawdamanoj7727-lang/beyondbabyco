import "server-only";

import { isProduction } from "@/lib/env.validation";

/** Dev-only API routes (/api/dev/*) must never run in production builds. */
export function isDevApiBlocked(): boolean {
  return isProduction();
}
