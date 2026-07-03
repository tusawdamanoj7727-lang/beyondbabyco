import type { Metadata } from "next";
import { redirect } from "next/navigation";

import RegisterForm from "./RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Account — BeyondBabyCo",
  description: "Create your BeyondBabyCo account to shop, track orders, and save favourites.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  const { redirectTo } = await searchParams;
  return <RegisterForm redirectTo={redirectTo} />;
}
