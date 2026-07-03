import { OpsSection, OpsCheckList, OpsStatusBadge } from "@/components/admin/operations/OpsShared";
import { getOperationsOverview } from "@/lib/admin/operations";

export default async function OperationsPerformancePage() {
  const data = await getOperationsOverview();

  return (
    <div className="space-y-6">
      <OpsSection title="Performance center" description="Report-only — no new optimizations applied.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.performance.map((item) => (
            <li key={item.id} className="rounded-2xl border border-cream-200 p-4 dark:border-green-800">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-green-900 dark:text-cream-50">{item.label}</p>
                {item.status && <OpsStatusBadge status={item.status} />}
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-green-800 dark:text-cream-100">{item.value}</p>
              {item.hint && <p className="mt-1 text-xs text-green-700/60 dark:text-green-200/50">{item.hint}</p>}
            </li>
          ))}
        </ul>
      </OpsSection>

      <OpsSection title="Lighthouse checklist">
        <OpsCheckList
          items={data.lighthouse.map((item) => ({
            id: item.item,
            label: item.item,
            status: item.status,
          }))}
        />
      </OpsSection>

      <OpsSection title="Core Web Vitals guidance">
        <ul className="list-inside list-disc space-y-2 text-sm text-green-800 dark:text-green-100">
          <li>LCP (Largest Contentful Paint): target under 2.5 seconds on mobile.</li>
          <li>INP (Interaction to Next Paint): target under 200 milliseconds.</li>
          <li>CLS (Cumulative Layout Shift): target under 0.1 — reserve space for images and fonts.</li>
          <li>Use GA4 Web Vitals report or Chrome UX Report once analytics is connected.</li>
        </ul>
      </OpsSection>
    </div>
  );
}
