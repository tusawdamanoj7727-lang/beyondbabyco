"use client";

import { useActionState, useId, useState } from "react";

import Button from "@/components/ui/Button";
import AuthShell, {
  AuthAlert,
  AuthTrustStrip,
  EyeIcon,
  LockIcon,
  authInputClasses,
} from "@/components/auth/AuthShell";
import {
  customerResetPasswordAction,
  type CustomerAuthState,
} from "@/lib/auth/customer-auth-actions";
import { cn } from "@/lib/utils";

const initialState: CustomerAuthState = { error: null, success: null };

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(customerResetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();
  const confirmId = useId();
  const errorId = useId();

  const fieldError = (field: string) => state.fieldErrors?.[field];

  return (
    <AuthShell
      mascotPose="hug"
      title="Choose a new password"
      subtitle="Enter a secure password for your BeyondBabyCo account"
    >
      <form action={formAction} className="space-y-4" noValidate>
        {state.error ? <AuthAlert id={errorId} variant="error" message={state.error} /> : null}

        <div className="space-y-1.5">
          <label htmlFor={passwordId} className="block text-sm font-semibold text-green-900">
            New password
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
              className={cn(`${authInputClasses} pr-12`, fieldError("password") && "border-terra-400")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-green-600"
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
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
              className={cn(authInputClasses, fieldError("confirmPassword") && "border-terra-400")}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
          {isPending ? "Updating…" : "Update Password"}
        </Button>
      </form>
      <AuthTrustStrip />
    </AuthShell>
  );
}
