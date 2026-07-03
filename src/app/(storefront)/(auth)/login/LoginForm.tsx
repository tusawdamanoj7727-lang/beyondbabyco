"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";

import Button from "@/components/ui/Button";
import AuthShell, {
  AuthAlert,
  AuthFooterLink,
  AuthTrustStrip,
  EyeIcon,
  LockIcon,
  MailIcon,
  authInputClasses,
} from "@/components/auth/AuthShell";
import OAuthButtons, { OAuthDivider } from "@/components/auth/OAuthButtons";
import {
  customerSignInAction,
  type CustomerAuthState,
} from "@/lib/auth/customer-auth-actions";

const initialState: CustomerAuthState = { error: null, success: null };

export default function CustomerLoginForm({
  redirectTo,
  authError,
  resetSuccess,
}: {
  redirectTo?: string;
  authError?: string;
  resetSuccess?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(customerSignInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const checkoutIntent = redirectTo === "/checkout" || redirectTo?.startsWith("/checkout?");

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const registerHref = redirectTo
    ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/register";

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        checkoutIntent
          ? "Sign in to complete your order — we'll bring you right back to checkout."
          : "Sign in to your BeyondBabyCo account"
      }
      footer={
        <AuthFooterLink prompt="New here?" href={registerHref} label="Create an account" />
      }
    >
      <OAuthButtons redirectTo={redirectTo} />
      <OAuthDivider />

      <form action={formAction} className="space-y-4" noValidate>
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}

        {resetSuccess ? (
          <AuthAlert variant="success" message="Password updated successfully. Sign in with your new password." />
        ) : null}

        {authError ? <AuthAlert variant="error" message={authError} /> : null}

        {state.error ? (
          <AuthAlert id={errorId} variant="error" message={state.error} />
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor={emailId} className="block text-sm font-semibold text-green-900">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600">
              <MailIcon />
            </span>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              placeholder="you@beyondbabyco.com"
              aria-describedby={state.error ? errorId : undefined}
              className={authInputClasses}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={passwordId} className="block text-sm font-semibold text-green-900">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600">
              <LockIcon />
            </span>
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="Enter your password"
              aria-describedby={state.error ? errorId : undefined}
              className={`${authInputClasses} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-green-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60"
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-terra-600 transition-colors hover:text-terra-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60 rounded"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
          {isPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <AuthTrustStrip />
    </AuthShell>
  );
}
