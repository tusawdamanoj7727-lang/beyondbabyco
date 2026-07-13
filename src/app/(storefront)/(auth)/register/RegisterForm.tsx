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
  UserIcon,
  authInputClasses,
} from "@/components/auth/AuthShell";
import OAuthButtons, { OAuthDivider } from "@/components/auth/OAuthButtons";
import {
  customerSignUpAction,
  type CustomerAuthState,
} from "@/lib/auth/customer-auth-actions";
import { cn } from "@/lib/utils";

const initialState: CustomerAuthState = { error: null, success: null };

export default function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(customerSignUpAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const loginHref = redirectTo
    ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/login";

  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const messageId = useId();

  const fieldError = (field: string) => state.fieldErrors?.[field];

  return (
    <AuthShell
      mascotPose="wave"
      title="Create your account"
      subtitle="Join BeyondBabyCo for a safer, smarter baby care journey"
      footer={
        state.success ? null : (
          <AuthFooterLink prompt="Already have an account?" href={loginHref} label="Sign in" />
        )
      }
    >
      {state.success ? (
        <div className="space-y-4">
          <AuthAlert id={messageId} variant="success" message={state.success} />
          <Button asChild variant="primary" size="lg" fullWidth>
            <Link href={loginHref}>Go to Sign In</Link>
          </Button>
        </div>
      ) : (
        <>
          <OAuthButtons redirectTo={redirectTo} />
          <OAuthDivider />

          <form action={formAction} className="space-y-4" noValidate>
          {state.error ? (
            <AuthAlert id={messageId} variant="error" message={state.error} />
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor={fullNameId} className="block text-sm font-semibold text-green-900">
              Full name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600">
                <UserIcon />
              </span>
              <input
                id={fullNameId}
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Your name"
                aria-describedby={fieldError("fullName") ? `${fullNameId}-error` : undefined}
                className={cn(authInputClasses, fieldError("fullName") && "border-terra-400")}
              />
            </div>
            {fieldError("fullName") ? (
              <p id={`${fullNameId}-error`} className="text-xs font-medium text-terra-600">
                {fieldError("fullName")}
              </p>
            ) : null}
          </div>

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
                required
                placeholder="you@beyondbabyco.com"
                className={cn(authInputClasses, fieldError("email") && "border-terra-400")}
              />
            </div>
            {fieldError("email") ? (
              <p className="text-xs font-medium text-terra-600">{fieldError("email")}</p>
            ) : null}
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className={cn(`${authInputClasses} pr-12`, fieldError("password") && "border-terra-400")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-green-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60"
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            {fieldError("password") ? (
              <p className="text-xs font-medium text-terra-600">{fieldError("password")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={confirmId} className="block text-sm font-semibold text-green-900">
              Confirm password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-600">
                <LockIcon />
              </span>
              <input
                id={confirmId}
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Repeat your password"
                className={cn(authInputClasses, fieldError("confirmPassword") && "border-terra-400")}
              />
            </div>
            {fieldError("confirmPassword") ? (
              <p className="text-xs font-medium text-terra-600">{fieldError("confirmPassword")}</p>
            ) : null}
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
            {isPending ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <AuthTrustStrip />
        </>
      )}
    </AuthShell>
  );
}
