import { redirect } from "next/navigation";

import AccountDashboard from "@/components/account/AccountDashboard";
import { getCustomerDashboardData } from "@/lib/account/dashboard";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const user = await requireCustomerSession();
  if (!user) redirect("/login?redirectTo=/account");

  const params = await searchParams;
  const [profile, dashboard] = await Promise.all([getCurrentProfile(), getCustomerDashboardData()]);
  if (!dashboard) redirect("/login?redirectTo=/account");

  const name = profile?.fullName ?? user.email?.split("@")[0] ?? "there";

  return (
    <AccountDashboard
      name={name}
      stats={dashboard.stats}
      recentOrders={dashboard.recentOrders}
      recommended={dashboard.recommended}
      emailVerified={params.verified === "1"}
    />
  );
}
