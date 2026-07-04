import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEVELOPMENT_APP_URL,
  PRODUCTION_APP_URL,
  appUrlMatchesOrigin,
  assertAppUrlMatchesOrigin,
  getAppUrl,
  getAppUrlPort,
  normalizeAppUrl,
} from "@/lib/app-url";

describe("app-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes trailing slashes", () => {
    expect(normalizeAppUrl("http://localhost:3003/")).toBe("http://localhost:3003");
  });

  it("returns NEXT_PUBLIC_APP_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://beyondbabyco.in/");
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppUrl()).toBe("https://beyondbabyco.in");
  });

  it("falls back to production URL when unset in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppUrl()).toBe(PRODUCTION_APP_URL);
  });

  it("falls back to localhost in development when unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getAppUrl()).toBe(DEVELOPMENT_APP_URL);
  });

  it("ignores localhost NEXT_PUBLIC_APP_URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getAppUrl()).toBe(PRODUCTION_APP_URL);
  });

  it("uses VERCEL_URL in production when APP_URL unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_URL", "beyondbabyco.vercel.app");
    expect(getAppUrl()).toBe("https://beyondbabyco.vercel.app");
  });

  it("parses explicit port from app URL", () => {
    expect(getAppUrlPort("http://localhost:3003")).toBe(3003);
    expect(getAppUrlPort("https://beyondbabyco.in")).toBe(443);
  });

  it("matches request origin to configured APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://beyondbabyco.in");
    expect(appUrlMatchesOrigin("https://beyondbabyco.in")).toBe(true);
    expect(appUrlMatchesOrigin("http://localhost:3000")).toBe(false);
  });

  it("assertAppUrlMatchesOrigin throws on mismatch in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(() => assertAppUrlMatchesOrigin("http://localhost:3003")).toThrow(/APP_URL mismatch/);
  });

  it("assertAppUrlMatchesOrigin is a no-op in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://beyondbabyco.in");
    expect(() => assertAppUrlMatchesOrigin("http://localhost:3003")).not.toThrow();
  });
});
