import { OpsSection, OpsCheckList } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";

export default async function OperationsSecurityPage() {
  const data = await getOperationsOverview();

  return (
    <div className="space-y-6">
      <OpsSection title="Security dashboard" description="HTTPS, secrets, webhooks, headers, CSRF, and RLS summary (read-only).">
        <OpsCheckList items={data.security} />
      </OpsSection>
    </div>
  );
}
