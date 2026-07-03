"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select, Checkbox } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  GATEWAY_PROVIDERS,
  GATEWAY_PROVIDER_LABELS,
  type GatewayDetail,
  type GatewayProvider,
} from "@/lib/admin/payment-types";
import { createPaymentGateway, updatePaymentGateway } from "@/lib/admin/payment-actions";

type FormState = {
  display_name: string;
  provider: GatewayProvider;
  sandbox: boolean;
  api_key: string;
  api_secret: string;
  webhook_secret: string;
  webhook_url: string;
  currency: string;
  is_enabled: boolean;
  priority: number;
};

function defaultForm(): FormState {
  return {
    display_name: "",
    provider: "razorpay",
    sandbox: true,
    api_key: "",
    api_secret: "",
    webhook_secret: "",
    webhook_url: "",
    currency: "INR",
    is_enabled: false,
    priority: 0,
  };
}

export default function GatewayForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: GatewayDetail | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          display_name: initial.displayName,
          provider: initial.provider,
          sandbox: initial.sandbox,
          api_key: "",
          api_secret: "",
          webhook_secret: "",
          webhook_url: initial.webhookUrl ?? "",
          currency: initial.currency,
          is_enabled: initial.isEnabled,
          priority: initial.priority,
        }
      : defaultForm(),
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        display_name: form.display_name,
        provider: form.provider,
        sandbox: form.sandbox,
        api_key: form.api_key || null,
        api_secret: form.api_secret || null,
        webhook_secret: form.webhook_secret || null,
        webhook_url: form.webhook_url || null,
        currency: form.currency,
        is_enabled: form.is_enabled,
        priority: form.priority,
      };
      const res =
        mode === "create"
          ? await createPaymentGateway(payload)
          : await updatePaymentGateway(initial!.id, payload);
      notifyActionResult(toast, res);
      if (!res.ok) return;
      router.push(mode === "create" ? `/admin/payment-gateways/${res.id}` : `/admin/payment-gateways/${initial!.id}`);
      router.refresh();
    });
  }

  const webhookEndpoint =
    typeof window !== "undefined" && initial
      ? `${window.location.origin}/api/webhooks/payments/${initial.id}`
      : initial
        ? `/api/webhooks/payments/${initial.id}`
        : "Set after creation";

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-cream-200 bg-white p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Display Name" required>
          <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required aria-label="Display name" />
        </FormField>
        <FormField label="Provider" required>
          <Select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as GatewayProvider })} aria-label="Provider">
            {GATEWAY_PROVIDERS.filter((p) => p !== "custom").map((p) => (
              <option key={p} value={p}>{GATEWAY_PROVIDER_LABELS[p]}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="API Key">
          <Input type="password" autoComplete="off" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} aria-label="API key" placeholder={mode === "edit" && initial?.hasApiKey ? "Leave blank to keep" : ""} />
        </FormField>
        <FormField label="API Secret">
          <Input type="password" autoComplete="off" value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} aria-label="API secret" placeholder={mode === "edit" && initial?.hasApiSecret ? "Leave blank to keep" : ""} />
        </FormField>
        <FormField label="Webhook Secret">
          <Input type="password" autoComplete="off" value={form.webhook_secret} onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })} aria-label="Webhook secret" placeholder={mode === "edit" && initial?.hasWebhookSecret ? "Leave blank to keep" : ""} />
        </FormField>
        <FormField label="Webhook URL">
          <Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} aria-label="Webhook URL" placeholder="Optional custom URL" />
        </FormField>
        <FormField label="Currency">
          <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} aria-label="Currency" />
        </FormField>
        <FormField label="Priority">
          <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} aria-label="Priority" />
        </FormField>
        <div className="flex flex-col gap-3 md:col-span-2">
          <Checkbox checked={form.sandbox} onChange={(e) => setForm({ ...form, sandbox: e.target.checked })} label="Sandbox mode" />
          <Checkbox checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} label="Enabled" />
        </div>
      </div>

      {mode === "edit" && (
        <div className="rounded-2xl bg-cream-50 p-4 text-sm">
          <p className="font-medium text-green-900">Inbound webhook endpoint</p>
          <code className="mt-1 block break-all text-xs text-green-800">{webhookEndpoint}</code>
          <p className="mt-2 text-green-700/60">Configure this URL in your gateway dashboard. Signature verification uses placeholder adapters until credentials are connected.</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{mode === "create" ? "Create Gateway" : "Save Changes"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
