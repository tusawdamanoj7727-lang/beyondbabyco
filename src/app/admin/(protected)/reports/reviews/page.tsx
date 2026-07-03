import { getReviewsReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function ReviewsReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "reviews", "Reviews Reports", "/admin/reports/reviews", getReviewsReport);
  return <ReportCategoryClient {...props} />;
}
