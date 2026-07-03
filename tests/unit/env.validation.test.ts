import { describe, expect, it, vi } from "vitest";

import { getProductionEnvWarnings, isProduction } from "@/lib/env.validation";

describe("env validation", () => {
  it("detects production mode", () => {
    expect(typeof isProduction()).toBe("boolean");
  });

  it("returns warnings array in production without secrets", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SENTRY_DSN;
    const warnings = getProductionEnvWarnings();
    vi.unstubAllEnvs();
    expect(Array.isArray(warnings)).toBe(true);
  });
});
