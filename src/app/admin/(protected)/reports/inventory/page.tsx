import { getInventoryReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function InventoryReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "inventory", "Inventory Reports", "/admin/reports/inventory", getInventoryReport);
  return <ReportCategoryClient {...props} />;
}
