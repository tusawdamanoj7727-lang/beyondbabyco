import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ForgotPasswordForm from "./ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Forgot Password",
  description: "Reset your BeyondBabyCo account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return <ForgotPasswordForm />;
}
