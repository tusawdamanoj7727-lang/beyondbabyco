import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ResetPasswordForm from "./ResetPasswordForm";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Reset Password",
  description: "Set a new password for your BeyondBabyCo account.",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=reset_session_expired");

  return <ResetPasswordForm />;
}
