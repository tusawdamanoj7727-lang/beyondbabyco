import { describe, expect, it, vi } from "vitest";

import { validateCsrf } from "@/lib/security/csrf";

function mockRequest(method: string, pathname: string, headers: Record<string, string> = {}) {
  return {
    method,
    nextUrl: { pathname, protocol: "https:" },
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? headers[key] ?? null,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("CSRF validation", () => {
  it("allows GET requests", () => {
    expect(validateCsrf(mockRequest("GET", "/api/test")).ok).toBe(true);
  });

  it("allows POST with matching origin", () => {
    const result = validateCsrf(
      mockRequest("POST", "/api/test", { origin: "https://example.com", host: "example.com" }),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects POST with mismatched origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateCsrf(
      mockRequest("POST", "/api/test", { origin: "https://evil.com", host: "example.com" }),
    );
    vi.unstubAllEnvs();
    expect(result.ok).toBe(false);
  });

  it("exempts health endpoints", () => {
    expect(validateCsrf(mockRequest("POST", "/api/health", {})).ok).toBe(true);
  });
});
