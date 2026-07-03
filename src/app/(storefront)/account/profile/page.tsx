import { redirect } from "next/navigation";

import ProfileClient from "@/components/account/ProfileClient";
import { getCustomerProfileAction } from "@/lib/account/profile-actions";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Profile",
  path: "/account/profile",
  noIndex: true,
});

export default async function AccountProfilePage() {
  const user = await requireCustomerSession();
  if (!user) redirect("/login?redirectTo=/account/profile");

  const profile = await getCustomerProfileAction();
  if (!profile) redirect("/login?redirectTo=/account/profile");

  return <ProfileClient initial={profile} />;
}
