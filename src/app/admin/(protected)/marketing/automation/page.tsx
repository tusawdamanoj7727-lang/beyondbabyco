import { listAutomation, getMarketingFilterOptions } from "@/lib/admin/marketing";
import AutomationClient from "./AutomationClient";

export default async function AutomationPage() {
  const [automation, options] = await Promise.all([listAutomation(), getMarketingFilterOptions()]);
  return <AutomationClient rows={automation.rows} segments={options.segments} templates={options.templates} />;
}
