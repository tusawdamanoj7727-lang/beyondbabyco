import type { Metadata } from "next";

import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminDashboardOverview } from "@/lib/admin/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardOverview();
  return <AdminDashboardClient data={data} />;
}
