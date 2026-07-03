import StatsCard from "@/components/admin/StatsCard";
import { OpsSection, OpsCheckList, OpsStatusBadge } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";

export default async function OperationsHealthPage() {
  const data = await getOperationsOverview();
  const overallStatus =
    data.health.overall === "ok" ? "ready" : data.health.overall === "degraded" ? "warning" : "error";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <OpsStatusBadge status={overallStatus} />
        <span className="text-sm text-green-700/70 dark:text-green-200/60">
          Overall system health — {data.health.probes.length} probes
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Database"
          value={data.health.probes.find((p) => p.name === "database")?.status ?? "—"}
          icon="activity"
          hint={data.health.probes.find((p) => p.name === "database")?.detail}
        />
        <StatsCard
          label="Storage"
          value={data.health.probes.find((p) => p.name === "storage")?.status ?? "—"}
          icon="media"
        />
        <StatsCard
          label="Email queue"
          value={data.health.probes.find((p) => p.name === "queues")?.detail ?? "—"}
          icon="newsletter"
        />
        <StatsCard label="Memory" value={data.health.probes.find((p) => p.name === "memory")?.detail ?? "—"} icon="reports" />
      </div>

      <OpsSection title="Health checks" description="Aggregated from /api/health probes and provider status.">
        <OpsCheckList items={data.health.checks} />
      </OpsSection>

      {data.envWarnings.length > 0 && (
        <OpsSection title="Environment warnings" description="Production checklist items requiring attention.">
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {data.envWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </OpsSection>
      )}
    </div>
  );
}
