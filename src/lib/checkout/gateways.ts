import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isProduction } from "@/lib/env.validation";

function decodeSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("enc:") ? value.slice(4) : value;
}

function encodeSecret(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.startsWith("enc:") ? value : `enc:${value}`;
}

/** User-facing + ops message when Razorpay keys are absent (env and admin gateway). */
export const PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE =
  "Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables, or enable Razorpay under Admin → Payment Gateways.";

export const RAZORPAY_WEBHOOK_NOT_CONFIGURED_MESSAGE =
  "Razorpay webhook secret not configured. Set RAZORPAY_WEBHOOK_SECRET in Vercel (from Razorpay Dashboard → Webhooks).";

/** Stable admin label for the env-synced production gateway row. */
export const ENV_BACKED_RAZORPAY_DISPLAY_NAME = "Razorpay (Production)";

function envRazorpayKeyId(): string | null {
  return (process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim() || null;
}

function envRazorpayKeySecret(): string | null {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

function envRazorpayWebhookSecret(): string | null {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

function publicSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.PLAYWRIGHT_BASE_URL?.trim() ||
    (isProduction() ? "https://beyondbabyco.in" : "");
  if (!raw) return "https://beyondbabyco.in";
  try {
    return new URL(raw).origin;
  } catch {
    return "https://beyondbabyco.in";
  }
}

/** True when process.env has both Razorpay API credentials (ops dashboard only). */
export function isRazorpayEnvConfigured(): boolean {
  return Boolean(envRazorpayKeyId() && envRazorpayKeySecret());
}

export function missingRazorpayEnvVars(): string[] {
  const missing: string[] = [];
  if (!envRazorpayKeyId()) missing.push("RAZORPAY_KEY_ID");
  if (!envRazorpayKeySecret()) missing.push("RAZORPAY_KEY_SECRET");
  if (!envRazorpayWebhookSecret()) missing.push("RAZORPAY_WEBHOOK_SECRET");
  return missing;
}

export interface StorefrontGateway {
  id: string;
  provider: string;
  displayName: string;
  keyId: string | null;
  keySecret: string | null;
  sandbox: boolean;
}

type GatewayRow = {
  id: string;
  provider: string;
  display_name: string;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  webhook_secret_encrypted: string | null;
  webhook_url: string | null;
  sandbox: boolean;
  is_enabled: boolean;
  deleted_at: string | null;
};

/**
 * Resolve API credentials for storefront/checkout.
 * Prefer any complete live (rzp_live_) pair from env or DB over test keys.
 * Production fallback: env then DB. Non-production: DB then env.
 */
function resolveGatewayCredentials(row: GatewayRow): {
  keyId: string | null;
  keySecret: string | null;
} {
  const dbKeyId = decodeSecret(row.api_key_encrypted);
  const dbKeySecret = decodeSecret(row.api_secret_encrypted);
  const envKeyId = envRazorpayKeyId();
  const envKeySecret = envRazorpayKeySecret();

  const pairs: Array<{ keyId: string; keySecret: string; source: "env" | "db" }> = [];
  if (envKeyId && envKeySecret) {
    pairs.push({ keyId: envKeyId, keySecret: envKeySecret, source: "env" });
  }
  if (dbKeyId && dbKeySecret) {
    pairs.push({ keyId: dbKeyId, keySecret: dbKeySecret, source: "db" });
  }

  const live = pairs.find((p) => p.keyId.startsWith("rzp_live_"));
  if (live) {
    return { keyId: live.keyId, keySecret: live.keySecret };
  }

  if (isProduction()) {
    const fromEnv = pairs.find((p) => p.source === "env");
    if (fromEnv) return { keyId: fromEnv.keyId, keySecret: fromEnv.keySecret };
  }

  return {
    keyId: dbKeyId ?? envKeyId,
    keySecret: dbKeySecret ?? envKeySecret,
  };
}

function toStorefrontGateway(row: GatewayRow): StorefrontGateway {
  const { keyId, keySecret } = resolveGatewayCredentials(row);
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.display_name,
    keyId,
    keySecret,
    sandbox: row.sandbox,
  };
}

export function logRazorpayCheckout(
  step: string,
  extra: Record<string, unknown> = {},
): void {
  console.info(
    JSON.stringify({
      scope: "checkout.razorpay",
      step,
      keyIdExists: typeof extra.keyIdExists === "boolean" ? extra.keyIdExists : undefined,
      keySecretExists:
        typeof extra.keySecretExists === "boolean" ? extra.keySecretExists : undefined,
      ...extra,
    }),
  );
}

/** Canonical production webhook path — alias resolves to the enabled Razorpay UUID. */
export const RAZORPAY_WEBHOOK_ALIAS = "razorpay";

function buildWebhookUrl(_gatewayId?: string): string {
  return `${publicSiteOrigin()}/api/webhooks/payments/${RAZORPAY_WEBHOOK_ALIAS}`;
}

async function findEnabledRazorpayRow(): Promise<GatewayRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("payment_gateways")
    .select(
      "id, provider, display_name, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted, webhook_url, sandbox, is_enabled, deleted_at",
    )
    .eq("provider", "razorpay")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as GatewayRow | null) ?? null;
}

async function syncGatewaySecretsAndWebhookUrl(row: GatewayRow): Promise<GatewayRow> {
  const supabase = createSupabaseServiceClient();
  const webhookUrl = buildWebhookUrl(row.id);
  const patch: {
    webhook_url?: string;
    webhook_secret_encrypted?: string | null;
    api_key_encrypted?: string | null;
    api_secret_encrypted?: string | null;
    sandbox?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (row.webhook_url !== webhookUrl) {
    patch.webhook_url = webhookUrl;
  }

  const envWh = envRazorpayWebhookSecret();
  const { isInvalidRazorpayWebhookSecret } = await import("@/lib/admin/gateway-adapters/razorpay");
  const dbWh = decodeSecret(row.webhook_secret_encrypted);
  if (dbWh && isInvalidRazorpayWebhookSecret(dbWh)) {
    // Clear URL-as-secret misconfiguration so HMAC can use a real env secret.
    patch.webhook_secret_encrypted = envWh && !isInvalidRazorpayWebhookSecret(envWh) ? encodeSecret(envWh) : null;
  } else if (envWh && !isInvalidRazorpayWebhookSecret(envWh) && !dbWh) {
    patch.webhook_secret_encrypted = encodeSecret(envWh);
  }

  const envKey = envRazorpayKeyId();
  const envSecret = envRazorpayKeySecret();
  const dbKey = decodeSecret(row.api_key_encrypted);
  const dbSecret = decodeSecret(row.api_secret_encrypted);
  // Production: overwrite stale DB keys when env is present (e.g. rzp_test_ left in DB).
  if (envKey && (!dbKey || (isProduction() && dbKey !== envKey))) {
    patch.api_key_encrypted = encodeSecret(envKey);
  }
  if (envSecret && (!dbSecret || (isProduction() && dbSecret !== envSecret))) {
    patch.api_secret_encrypted = encodeSecret(envSecret);
  }
  if (isProduction() && envKey) {
    patch.sandbox = envKey.startsWith("rzp_test_");
  }

  if (Object.keys(patch).length === 1) {
    return { ...row, webhook_url: row.webhook_url ?? webhookUrl };
  }

  const { data } = await supabase
    .from("payment_gateways")
    .update(patch)
    .eq("id", row.id)
    .select(
      "id, provider, display_name, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted, webhook_url, sandbox, is_enabled, deleted_at",
    )
    .single();

  return (data as GatewayRow | null) ?? { ...row, ...patch, webhook_url: patch.webhook_url ?? row.webhook_url };
}

/**
 * Ensures production has a real `payment_gateways` UUID for Razorpay.
 * Mode: Database gateway row, secrets sourced from Vercel env when DB fields are empty.
 * Never returns the legacy synthetic id `"env"` — webhooks and payments.gateway_id require a UUID.
 */
export async function ensureEnvBackedRazorpayGateway(): Promise<StorefrontGateway | null> {
  const existing = await findEnabledRazorpayRow();
  if (existing) {
    const synced = await syncGatewaySecretsAndWebhookUrl(existing);
    const gateway = toStorefrontGateway(synced);
    if (!gateway.keyId || !gateway.keySecret) return null;
    return gateway;
  }

  const keyId = envRazorpayKeyId();
  const keySecret = envRazorpayKeySecret();
  if (!keyId || !keySecret) return null;

  const supabase = createSupabaseServiceClient();
  const { data: created, error } = await supabase
    .from("payment_gateways")
    .insert({
      display_name: ENV_BACKED_RAZORPAY_DISPLAY_NAME,
      provider: "razorpay",
      sandbox: !isProduction(),
      currency: "INR",
      is_enabled: true,
      priority: 100,
      lifecycle_status: "active",
      api_key_encrypted: encodeSecret(keyId),
      api_secret_encrypted: encodeSecret(keySecret),
      webhook_secret_encrypted: encodeSecret(envRazorpayWebhookSecret()),
    })
    .select(
      "id, provider, display_name, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted, webhook_url, sandbox, is_enabled, deleted_at",
    )
    .single();

  if (error || !created) {
    // Race: another process may have inserted — re-read.
    const raced = await findEnabledRazorpayRow();
    if (!raced) return null;
    const synced = await syncGatewaySecretsAndWebhookUrl(raced);
    return toStorefrontGateway(synced);
  }

  const synced = await syncGatewaySecretsAndWebhookUrl(created as GatewayRow);
  return toStorefrontGateway(synced);
}

/**
 * Backfill orphan Razorpay payments that were created under the legacy env-only fallback.
 */
export async function backfillOrphanRazorpayGatewayIds(gatewayId: string): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ gateway_id: gatewayId })
    .eq("provider", "razorpay")
    .is("gateway_id", null)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }
  return data?.length ?? 0;
}

export async function getEnabledRazorpayGateway(): Promise<StorefrontGateway | null> {
  const gateway = await ensureEnvBackedRazorpayGateway();
  logRazorpayCheckout("getEnabledRazorpayGateway", {
    gatewaySelected: gateway?.provider ?? null,
    gatewayUuid: gateway?.id ?? null,
    gatewayEnabled: Boolean(gateway),
    paymentMode: gateway?.sandbox ? "sandbox" : gateway ? "live" : null,
    keyIdExists: Boolean(gateway?.keyId),
    keySecretExists: Boolean(gateway?.keySecret),
  });
  return gateway;
}

export async function getStorefrontPaymentOptions(): Promise<{
  razorpayAvailable: boolean;
  razorpayKeyId: string | null;
}> {
  const gateway = await getEnabledRazorpayGateway();
  return {
    razorpayAvailable: !!gateway?.keyId && !!gateway.keySecret,
    razorpayKeyId: gateway?.keyId ?? null,
  };
}

export async function isRazorpayWebhookConfigured(): Promise<boolean> {
  if (envRazorpayWebhookSecret()) return true;

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("payment_gateways")
    .select("webhook_secret_encrypted")
    .eq("provider", "razorpay")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { isInvalidRazorpayWebhookSecret } = await import(
    "@/lib/admin/gateway-adapters/razorpay"
  );
  const secret = data?.webhook_secret_encrypted;
  return Boolean(secret) && !isInvalidRazorpayWebhookSecret(secret);
}

/**
 * Resolve webhook path param to a real gateway UUID.
 * Accepts UUID, or legacy aliases `env` / `razorpay` (ensures DB row first).
 */
export async function resolveRazorpayWebhookGatewayId(
  gatewayIdOrAlias: string,
): Promise<string | null> {
  const trimmed = gatewayIdOrAlias.trim();
  if (!trimmed) return null;

  if (trimmed === "env" || trimmed === RAZORPAY_WEBHOOK_ALIAS) {
    const gateway = await ensureEnvBackedRazorpayGateway();
    return gateway?.id ?? null;
  }

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("payment_gateways")
    .select("id")
    .eq("id", trimmed)
    .is("deleted_at", null)
    .maybeSingle();

  if (data?.id) return data.id;

  // Unknown UUID but env is configured — auto-provision so production recovers after wipe.
  if (isRazorpayEnvConfigured()) {
    const gateway = await ensureEnvBackedRazorpayGateway();
    return gateway?.id ?? null;
  }

  return null;
}

/**
 * Production startup check — resolves env OR admin payment_gateways row.
 * Throws with a specific message when online payments cannot run.
 */
export async function validateProductionRazorpayConfig(): Promise<void> {
  if (!isProduction()) return;

  const gateway = await getEnabledRazorpayGateway();
  const missing: string[] = [];

  if (!gateway?.keyId || !gateway.keySecret) {
    if (!envRazorpayKeyId()) missing.push("RAZORPAY_KEY_ID");
    if (!envRazorpayKeySecret()) missing.push("RAZORPAY_KEY_SECRET");
  }

  const webhookOk = await isRazorpayWebhookConfigured();
  if (!webhookOk) {
    console.error(`[BeyondBabyCo] ${RAZORPAY_WEBHOOK_NOT_CONFIGURED_MESSAGE}`);
  }

  if (missing.length === 0) return;

  const message = `Payment gateway not configured for production. Missing: ${missing.join(", ")}. Set them in Vercel → Project → Settings → Environment Variables (Production), or configure Admin → Payment Gateways.`;
  console.error(`[BeyondBabyCo] ${message}`);
  throw new Error(message);
}
