import { redirect } from "next/navigation";

import SecurityClient from "@/components/account/SecurityClient";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "Security",
  path: "/account/security",
  noIndex: true,
});

export default async function AccountSecurityPage() {
  const user = await requireCustomerSession();
  if (!user) redirect("/login?redirectTo=/account/security");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const lastSignInAt =
    typeof data.user?.last_sign_in_at === "string" ? data.user.last_sign_in_at : null;

  return (
    <SecurityClient
      email={user.email ?? data.user?.email ?? ""}
      lastSignInAt={lastSignInAt}
    />
  );
}
