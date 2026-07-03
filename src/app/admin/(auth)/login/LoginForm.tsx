"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MotionSection from "@/components/ui/MotionSection";
import Reveal from "@/components/ui/Reveal";
import Logo from "@/components/brand/Logo";
import Mascot from "@/components/mascots/Mascot";
import { signInAction, type AuthActionState } from "@/lib/auth/auth";

const initialState: AuthActionState = { error: null };

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7" />
          <path d="M6.6 6.6A13.3 13.3 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
          <path d="m2 2 20 20" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

const inputBaseClasses =
  "h-12 w-full rounded-2xl border border-cream-300 bg-cream-50 pl-11 pr-4 text-base text-green-900 placeholder:text-green-700/40 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] focus:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60";

export default function LoginForm({
  redirectTo,
  authError,
}: {
  redirectTo?: string;
  authError?: string;
}) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const displayError = authError ?? state.error;

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <MotionSection as="div" variant="fadeUp" viewport={false} className="w-full">
      <Card variant="elevated" padding="lg" radius="4xl" className="w-full">
        {/* Brand + mascot */}
        <Reveal as="div" viewport={false} className="flex flex-col items-center text-center">
          <Logo size="md" href={null} priority />
          <Mascot
            mascot="bella-bunny"
            pose="welcome"
            size={104}
            priority
            animated
            floating
            duration={5}
          />
          <h1 className="mt-4 font-heading text-2xl font-bold text-green-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-green-700/70">
            Sign in to your admin account
          </p>
        </Reveal>

        <form action={formAction} className="mt-7 space-y-4" noValidate>
          {redirectTo ? (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          ) : null}

          {displayError ? (
            <div
              id={errorId}
              role="alert"
              className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm font-medium text-terra-700"
            >
              {displayError}
            </div>
          ) : null}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor={emailId}
              className="block text-sm font-semibold text-green-900"
            >
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
                aria-describedby={displayError ? errorId : undefined}
                className={inputBaseClasses}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor={passwordId}
              className="block text-sm font-semibold text-green-900"
            >
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
                aria-describedby={displayError ? errorId : undefined}
                className={`${inputBaseClasses} pr-12`}
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

          {/* Remember + forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-green-800 select-none">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="h-4 w-4 rounded border-cream-300 text-green-600 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-terra-600 transition-colors hover:text-terra-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60 rounded"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            {isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-xs text-green-700/60">
        Protected area · BeyondBabyCo, a unit of Tusawda Global Private Limited
      </p>
    </MotionSection>
  );
}
