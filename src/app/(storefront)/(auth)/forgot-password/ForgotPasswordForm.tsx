"use client";

import { useActionState, useId } from "react";
import Link from "next/link";

import Button from "@/components/ui/Button";
import AuthShell, {
  AuthAlert,
  AuthFooterLink,
  MailIcon,
  authInputClasses,
} from "@/components/auth/AuthShell";
import {
  customerForgotPasswordAction,
  type CustomerAuthState,
} from "@/lib/auth/customer-auth-actions";

const initialState: CustomerAuthState = { error: null, success: null };

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    customerForgotPasswordAction,
    initialState,
  );

  const emailId = useId();
  const messageId = useId();

  return (
    <AuthShell
      mascotPose="hug"
      title="Reset your password"
      subtitle="We will email you a secure link to choose a new password"
      footer={
        state.success ? (
          <Link
            href="/login"
            className="text-sm font-semibold text-terra-600 transition-colors hover:text-terra-700"
          >
            Back to sign in
          </Link>
        ) : (
          <AuthFooterLink prompt="Remember your password?" href="/login" label="Sign in" />
        )
      }
    >
      {state.success ? (
        <AuthAlert id={messageId} variant="success" message={state.success} />
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          {state.error ? (
            <AuthAlert id={messageId} variant="error" message={state.error} />
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
                required
                placeholder="you@beyondbabyco.com"
                aria-describedby={state.error ? messageId : undefined}
                className={authInputClasses}
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
            {isPending ? "Sending link…" : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
