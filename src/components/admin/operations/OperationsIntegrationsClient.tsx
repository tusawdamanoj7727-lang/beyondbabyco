"use client";

import { useState, useTransition } from "react";

import {
  sendTestEmailAction,
  testAnalyticsEventAction,
  triggerSampleErrorAction,
  checkEmailHealthAction,
} from "@/lib/admin/operations-actions";
import type { OperationsOverview } from "@/lib/admin/operations";
import type { ExternalAnalyticsProvider } from "@/lib/analytics/types";
import { OpsSection, OpsStatusBadge, OpsCheckList } from "./OpsShared";

export default function OperationsIntegrationsClient({
  data,
  allowSampleError = false,
}: {
  data: OperationsOverview;
  allowSampleError?: boolean;
}) {
  const [emailTo, setEmailTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string; detail?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? `${result.message}${result.detail ? ` — ${result.detail}` : ""}` : result.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <OpsSection title="Email provider" description="Environment-driven transactional email via Phase 9.3 templates.">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <OpsStatusBadge status={data.email.status === "ok" ? "ready" : data.email.status === "degraded" ? "warning" : "missing"} />
          <span className="text-sm text-green-700/70 dark:text-green-200/60">
            {data.email.provider ?? "none"} — {data.email.detail}
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium text-green-900 dark:text-cream-50">Test recipient</span>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-cream-300 px-3 py-2 dark:border-green-700 dark:bg-green-950"
            />
          </label>
          <button
            type="button"
            disabled={pending || !emailTo}
            onClick={() => run(() => sendTestEmailAction(emailTo))}
            className="rounded-xl bg-terra-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send test email
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => checkEmailHealthAction())}
            className="rounded-xl border border-cream-300 px-4 py-2 text-sm font-semibold dark:border-green-700"
          >
            Health check
          </button>
        </div>
      </OpsSection>

      <OpsSection title="Analytics integrations" description="GA4, Meta Pixel, Clarity, and Search Console verification.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.analytics.map((item) => (
            <li key={item.provider} className="rounded-2xl border border-cream-200 p-4 dark:border-green-800">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-green-900 dark:text-cream-50">{item.label}</p>
                <OpsStatusBadge status={item.connected ? "ready" : item.configured ? "warning" : "missing"} />
              </div>
              <p className="mt-1 text-xs text-green-700/70 dark:text-green-200/60">{item.description}</p>
              <button
                type="button"
                disabled={pending || !item.configured}
                onClick={() => run(() => testAnalyticsEventAction(item.provider as ExternalAnalyticsProvider))}
                className="mt-3 text-xs font-semibold text-terra-600 hover:underline disabled:opacity-40"
              >
                Prepare test event
              </button>
            </li>
          ))}
        </ul>
      </OpsSection>

      <OpsSection title="Error tracking" description="Sentry, Better Stack, or Logtail — optional, no mandatory dependency.">
        <OpsCheckList
          items={data.errorTrackingProviders.map((p) => ({
            id: p.provider,
            label: p.label,
            status: p.configured ? "ready" : "missing",
            detail: p.detail,
          }))}
        />
        <p className="mt-3 text-sm text-green-700/70">
          Active: <strong>{data.errorTracking.label}</strong> — {data.errorTracking.detail}
        </p>
        {allowSampleError && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => triggerSampleErrorAction())}
            className="mt-3 rounded-xl border border-terra-300 px-4 py-2 text-sm font-semibold text-terra-700"
          >
            Trigger sample error (dev only)
          </button>
        )}
      </OpsSection>

      {message && (
        <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-100" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
