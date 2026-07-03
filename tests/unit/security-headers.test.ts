import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, SECURITY_HEADERS } from "@/lib/security/headers";

describe("security headers", () => {
  it("includes CSP with frame-ancestors none", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
  });

  it("sets XSS and clickjacking protections", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["X-XSS-Protection"]).toContain("mode=block");
  });
});
