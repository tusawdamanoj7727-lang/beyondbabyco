import { getGSTSummary, listGstReports } from "@/lib/admin/finance";
import GstClient from "./GstClient";

export default async function GstPage() {
  const [summary, reports] = await Promise.all([getGSTSummary(), listGstReports()]);
  return <GstClient summary={summary} reports={reports} />;
}
