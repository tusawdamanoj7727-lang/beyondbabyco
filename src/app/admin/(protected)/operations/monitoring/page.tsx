import StatsCard from "@/components/admin/StatsCard";
import { OpsSection, OpsCheckList } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";

export default async function OperationsMonitoringPage() {
  const data = await getOperationsOverview();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard label="Application" value="Running" icon="dashboard" hint={data.health.probes.find((p) => p.name === "application")?.detail} />
        <StatsCard label="Disk usage" value={data.diskUsage.split(" ")[0] + " GB"} icon="inventory" hint={data.diskUsage} />
        <StatsCard
          label="Background jobs"
          value={data.health.probes.find((p) => p.name === "queues")?.detail?.replace(" email items queued", "") ?? "0"}
          icon="activity"
          hint="Queued email items"
        />
      </div>

      <OpsSection title="Service monitoring" description="Reuses existing health endpoints and env validation.">
        <OpsCheckList
          items={[
            ...data.health.checks,
            {
              id: "disk",
              label: "Disk usage",
              status: "ready" as const,
              detail: data.diskUsage,
            },
          ]}
        />
      </OpsSection>

      <OpsSection title="Provider status" description="Email, payment, shipping, and AI services.">
        <OpsCheckList
          items={[
            {
              id: "email-provider",
              label: "Email provider",
              status: data.email.status === "ok" ? "ready" : data.email.status === "degraded" ? "warning" : "missing",
              detail: `${data.email.provider ?? "none"} — ${data.email.detail}`,
            },
            {
              id: "payment-provider",
              label: "Payment provider",
              status: data.health.checks.find((c) => c.id === "payment")?.status ?? "warning",
              detail: data.health.checks.find((c) => c.id === "payment")?.detail,
            },
            {
              id: "shipping-provider",
              label: "Shipping provider",
              status: data.health.checks.find((c) => c.id === "shipping")?.status ?? "warning",
              detail: data.health.checks.find((c) => c.id === "shipping")?.detail,
            },
            {
              id: "ai-service",
              label: "AI service",
              status: data.health.checks.find((c) => c.id === "ai")?.status ?? "ready",
              detail: data.health.checks.find((c) => c.id === "ai")?.detail,
            },
          ]}
        />
      </OpsSection>
    </div>
  );
}
