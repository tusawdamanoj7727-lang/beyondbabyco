"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import {
  changeAccountPasswordAction,
  sendPasswordResetEmailAction,
  type SecurityActionState,
} from "@/lib/account/security-actions";
import { formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const initial: SecurityActionState = { error: null, success: null };

export default function SecurityClient({
  email,
  lastSignInAt,
}: {
  email: string;
  lastSignInAt: string | null;
}) {
  const toast = useToast();
  const [changeState, changeAction, changePending] = useActionState(
    changeAccountPasswordAction,
    initial,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    sendPasswordResetEmailAction,
    initial,
  );

  useEffect(() => {
    if (changeState.success) toast.success(changeState.success);
    if (changeState.error) toast.error(changeState.error);
  }, [changeState, toast]);

  useEffect(() => {
    if (resetState.success) toast.success(resetState.success);
    if (resetState.error) toast.error(resetState.error);
  }, [resetState, toast]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-green-900">Security</h1>
        <p className="text-sm text-green-700">
          Manage your password and account access.
        </p>
      </div>

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-green-700" aria-hidden />
          <div>
            <h2 className="font-heading text-lg font-bold text-green-900">Account security</h2>
            <p className="mt-1 text-sm text-green-700">
              Signed in as <span className="font-semibold">{email}</span>.
              {lastSignInAt ? (
                <>
                  {" "}
                  Last sign-in{" "}
                  {new Date(lastSignInAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  .
                </>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-green-700">
              Use a unique password. We never share your credentials. For help, visit{" "}
              <Link href="/account/support" className="font-semibold text-terra-600 hover:underline">
                Support
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
        <h2 className="font-heading text-lg font-bold text-green-900">Change password</h2>
        <p className="text-sm text-green-700">Update your password while signed in.</p>
        <form action={changeAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-green-900">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className={cn(formControl, "w-full")}
              aria-invalid={Boolean(changeState.fieldErrors?.password)}
            />
            {changeState.fieldErrors?.password ? (
              <p className="mt-1 text-xs text-terra-700">{changeState.fieldErrors.password}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-semibold text-green-900"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className={cn(formControl, "w-full")}
              aria-invalid={Boolean(changeState.fieldErrors?.confirmPassword)}
            />
            {changeState.fieldErrors?.confirmPassword ? (
              <p className="mt-1 text-xs text-terra-700">{changeState.fieldErrors.confirmPassword}</p>
            ) : null}
          </div>
          <Button type="submit" variant="primary" disabled={changePending}>
            {changePending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
        <h2 className="font-heading text-lg font-bold text-green-900">Password reset</h2>
        <p className="text-sm text-green-700">
          Send a secure reset link to <span className="font-semibold">{email}</span>. You can also use{" "}
          <Link href="/forgot-password" className="font-semibold text-terra-600 hover:underline">
            Forgot password
          </Link>{" "}
          when signed out.
        </p>
        <form action={resetAction}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="outline" disabled={resetPending}>
            {resetPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
              </>
            ) : (
              "Email password reset link"
            )}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-2">
        <h2 className="font-heading text-lg font-bold text-green-900">Active sessions</h2>
        <p className="text-sm text-green-700">
          This device is signed in. Session listing across devices is not available in the customer
          portal — sign out from any shared device when finished, or change your password to end
          other sessions.
        </p>
      </section>
    </div>
  );
}
