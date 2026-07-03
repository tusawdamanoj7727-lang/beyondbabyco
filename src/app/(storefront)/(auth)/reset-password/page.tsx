import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ResetPasswordForm from "./ResetPasswordForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Reset Password — BeyondBabyCo",
  description: "Set a new password for your BeyondBabyCo account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=reset_session_expired");

  return <ResetPasswordForm />;
}
