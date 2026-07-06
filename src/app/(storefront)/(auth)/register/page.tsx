import type { Metadata } from "next";
import { redirect } from "next/navigation";

import RegisterForm from "./RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Create Account",
  description: "Create your BeyondBabyCo account to shop, track orders, and save favourites.",
  path: "/register",
  noIndex: true,
});

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
