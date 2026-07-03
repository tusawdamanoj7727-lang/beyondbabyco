import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ForgotPasswordForm from "./ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Forgot Password — BeyondBabyCo",
  description: "Reset your BeyondBabyCo account password.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return <ForgotPasswordForm />;
}
