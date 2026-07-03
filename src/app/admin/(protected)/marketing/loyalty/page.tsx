import { getLoyaltyDashboard } from "@/lib/admin/marketing";
import LoyaltyClient from "./LoyaltyClient";

export default async function LoyaltyPage() {
  const dashboard = await getLoyaltyDashboard();
  return <LoyaltyClient dashboard={dashboard} />;
}
