import type { Metadata } from "next";

import { CALLBACK_ERROR_MESSAGES, callbackErrorMessage } from "@/lib/auth/auth-errors";
import LoginForm from "./LoginForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin Login",
  description: "Secure admin sign-in for BeyondBabyCo store management.",
  path: "/admin/login",
  noIndex: true,
});

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error
    ? callbackErrorMessage(params.error, params.reason) ||
      CALLBACK_ERROR_MESSAGES[params.error] ||
      "Authentication failed. Please try again."
    : undefined;

  return (
    <main id="main-content">
      <LoginForm redirectTo={params.redirectTo} authError={authError} />
    </main>
  );
}
