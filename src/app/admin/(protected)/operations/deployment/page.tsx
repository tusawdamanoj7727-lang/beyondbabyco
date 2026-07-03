import StatsCard from "@/components/admin/StatsCard";
import { OpsSection, OpsCheckList, OpsStatusBadge } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";
import { generateProductionReadinessReport } from "@/lib/operations/readiness";

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  integrations: "Integrations",
  seo: "SEO & social",
  security: "Security",
  automation: "Automation",
};

export default async function OperationsDeploymentPage() {
  const [data, readiness] = await Promise.all([getOperationsOverview(), generateProductionReadinessReport()]);
  const { deploymentSummary } = data;

  return (
    <div className="space-y-6">
      <OpsSection
        title="Production readiness"
        description={`Generated ${new Date(readiness.generatedAt).toLocaleString()} — ${readiness.readyForLaunch ? "Ready for launch" : "Blockers remain"}`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <OpsStatusBadge status={readiness.readyForLaunch ? "ready" : "warning"} />
          <span className="text-sm text-green-700/70">{readiness.appUrl}</span>
        </div>
        {readiness.blockers.length > 0 && (
          <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {readiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        <OpsCheckList
          items={readiness.checks.slice(0, 12).map((c) => ({
            id: c.id,
            label: c.label,
            status: c.status,
            detail: c.detail,
          }))}
        />
      </OpsSection>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Ready" value={String(deploymentSummary.ready)} icon="activity" trend={{ value: "items", positive: true }} />
        <StatsCard label="Warnings" value={String(deploymentSummary.warning)} icon="reports" />
        <StatsCard label="Missing" value={String(deploymentSummary.missing)} icon="inventory" />
      </div>

      {(["infrastructure", "integrations", "seo", "security", "automation"] as const).map((category) => {
        const items = data.deployment.filter((d) => d.category === category);
        if (!items.length) return null;
        return (
          <OpsSection key={category} title={CATEGORY_LABELS[category] ?? category}>
            <ul className="divide-y divide-cream-200 dark:divide-green-800">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-green-900 dark:text-cream-50">{item.label}</p>
                    <p className="text-sm text-green-700/70 dark:text-green-200/60">{item.detail}</p>
                  </div>
                  <OpsStatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          </OpsSection>
        );
      })}

      <OpsSection title="Full checklist">
        <OpsCheckList
          items={data.deployment.map((d) => ({
            id: d.id,
            label: d.label,
            status: d.status,
            detail: d.detail,
          }))}
        />
      </OpsSection>
    </div>
  );
}
