import { OpsSection, OpsCheckList } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";

export default async function OperationsBackupsPage() {
  const data = await getOperationsOverview();

  return (
    <div className="space-y-6">
      <OpsSection title="Backup status" description="Informational — use Supabase and deployment tooling for live backups.">
        <OpsCheckList
          items={data.backups.map((b) => ({
            id: b.id,
            label: b.label,
            status: b.status,
            detail: b.detail,
            hint: b.lastRun ? `Last run: ${b.lastRun}` : undefined,
          }))}
        />
      </OpsSection>

      <OpsSection title="Restore guide">
        <ol className="list-inside list-decimal space-y-2 text-sm text-green-800 dark:text-green-100">
          {data.restoreSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </OpsSection>
    </div>
  );
}
