import { afterEach, describe, expect, it, vi } from "vitest";

import {
  appUrlMatchesOrigin,
  assertAppUrlMatchesOrigin,
  getAppUrl,
  getAppUrlPort,
  normalizeAppUrl,
} from "@/lib/app-url";

describe("app-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("normalizes trailing slashes", () => {
    expect(normalizeAppUrl("http://localhost:3003/")).toBe("http://localhost:3003");
  });

  it("returns NEXT_PUBLIC_APP_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3003/");
    vi.stubEnv("NODE_ENV", "development");
    expect(getAppUrl()).toBe("http://localhost:3003");
  });

  it("throws when NEXT_PUBLIC_APP_URL is missing outside test", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => getAppUrl()).toThrow(/NEXT_PUBLIC_APP_URL is required/);
  });

  it("parses explicit port from app URL", () => {
    expect(getAppUrlPort("http://localhost:3003")).toBe(3003);
    expect(getAppUrlPort("https://beyondbabyco.com")).toBe(443);
    expect(getAppUrlPort("http://beyondbabyco.com")).toBe(80);
  });

  it("matches request origin to configured APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3003");
    expect(appUrlMatchesOrigin("http://localhost:3003")).toBe(true);
    expect(appUrlMatchesOrigin("http://localhost:3000")).toBe(false);
  });

  it("assertAppUrlMatchesOrigin throws on mismatch in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(() => assertAppUrlMatchesOrigin("http://localhost:3003")).toThrow(/APP_URL mismatch/);
  });

  it("assertAppUrlMatchesOrigin is a no-op in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(() => assertAppUrlMatchesOrigin("http://localhost:3003")).not.toThrow();
  });
});
