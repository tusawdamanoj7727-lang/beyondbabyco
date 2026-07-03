import Link from "next/link";

import { getAnalyticsIntegrationStatuses } from "@/lib/analytics/integrations";

export default function AnalyticsIntegrationsPanel() {
  const integrations = getAnalyticsIntegrationStatuses();

  return (
    <section aria-labelledby="integrations-heading" className="rounded-3xl border border-dashed border-cream-300 bg-white p-6 dark:border-green-700 dark:bg-green-950/40">
      <h3 id="integrations-heading" className="font-heading text-lg font-bold text-green-900 dark:text-cream-50">
        External integrations
      </h3>
      <p className="mt-1 text-sm text-green-700/70 dark:text-green-200/70">
        Configure providers via environment variables — manage tests at{" "}
        <Link href="/admin/operations/integrations" className="font-semibold text-terra-600 hover:underline">
          Operations → Integrations
        </Link>
        .
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {integrations.map((item) => (
          <li key={item.provider} className="rounded-2xl border border-cream-200 p-4 dark:border-green-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-green-900 dark:text-cream-50">{item.label}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.connected
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                    : item.configured
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-cream-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                }`}
              >
                {item.connected ? "Connected" : item.configured ? "Configured" : "Not connected"}
              </span>
            </div>
            <p className="mt-1 text-xs text-green-700/70 dark:text-green-200/60">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
