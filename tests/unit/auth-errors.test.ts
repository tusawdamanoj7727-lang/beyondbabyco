import { describe, expect, it } from "vitest";
import type { AuthError } from "@supabase/supabase-js";

import {
  CALLBACK_ERROR_MESSAGES,
  mapSupabaseAuthError,
} from "@/lib/auth/auth-errors";

function mockAuthError(partial: Pick<AuthError, "message" | "code"> & { name?: string }): AuthError {
  return {
    name: partial.name ?? "AuthApiError",
    message: partial.message,
    code: partial.code,
    status: 400,
  } as unknown as AuthError;
}

describe("mapSupabaseAuthError", () => {
  it("maps email not confirmed", () => {
    const msg = mapSupabaseAuthError(
      mockAuthError({ message: "Email not confirmed", code: "email_not_confirmed" }),
    );
    expect(msg).toContain("confirm your email");
  });

  it("maps invalid credentials", () => {
    const msg = mapSupabaseAuthError(
      mockAuthError({ message: "Invalid login credentials", code: "invalid_credentials" }),
    );
    expect(msg).toContain("Incorrect email or password");
  });

  it("maps rate limit", () => {
    const msg = mapSupabaseAuthError(
      mockAuthError({ message: "Too many requests", code: "over_request_rate_limit" }),
    );
    expect(msg).toContain("Too many sign-in attempts");
  });
});

describe("CALLBACK_ERROR_MESSAGES", () => {
  it("includes exchange failure message", () => {
    expect(CALLBACK_ERROR_MESSAGES.auth_callback_exchange_failed).toBeTruthy();
  });
});
