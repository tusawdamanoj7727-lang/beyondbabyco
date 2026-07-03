import dynamic from "next/dynamic";

import { getFinanceDashboard, getFinancialReports } from "@/lib/admin/finance";
import { ensureDefaultBankAccount } from "@/lib/admin/finance-actions";
import ModuleLoading from "@/components/ui/ModuleLoading";

const FinanceDashboardClient = dynamic(() => import("./FinanceDashboardClient"), {
  loading: () => <ModuleLoading label="Loading finance dashboard…" />,
});

export default async function FinancePage() {
  await ensureDefaultBankAccount();
  const [dashboard, reports] = await Promise.all([getFinanceDashboard(), getFinancialReports()]);
  return <FinanceDashboardClient dashboard={dashboard} reports={reports} />;
}
