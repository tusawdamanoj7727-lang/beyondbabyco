import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ensureCustomerRecordsForUser } from "@/lib/auth/customer-bootstrap";
import { CALLBACK_ERROR_MESSAGES, callbackErrorMessage } from "@/lib/auth/auth-errors";
import { getCurrentUser } from "@/lib/auth/session";
import CustomerLoginForm from "./LoginForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign In",
  description: "Sign in to your BeyondBabyCo account to track orders and manage your profile.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; reason?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    try {
      await ensureCustomerRecordsForUser(user);
    } catch {
      /* bootstrap optional */
    }
    redirect("/account");
  }

  const params = await searchParams;
  const authError = params.error
    ? callbackErrorMessage(params.error, params.reason) ||
      CALLBACK_ERROR_MESSAGES[params.error] ||
      "Authentication failed. Please try again."
    : undefined;

  return (
    <CustomerLoginForm
      redirectTo={params.redirectTo}
      authError={authError}
      resetSuccess={params.reset === "success"}
    />
  );
}
