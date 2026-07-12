import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isProduction } from "@/lib/env.validation";

function decodeSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("enc:") ? value.slice(4) : value;
}

/** User-facing + ops message when Razorpay keys are absent (env and admin gateway). */
export const PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE =
  "Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables, or enable Razorpay under Admin → Payment Gateways.";

export const RAZORPAY_WEBHOOK_NOT_CONFIGURED_MESSAGE =
  "Razorpay webhook secret not configured. Set RAZORPAY_WEBHOOK_SECRET in Vercel (from Razorpay Dashboard → Webhooks).";

function envRazorpayKeyId(): string | null {
  return (process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim() || null;
}

function envRazorpayKeySecret(): string | null {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

/** True when process.env has both Razorpay API credentials (ops dashboard only). */
export function isRazorpayEnvConfigured(): boolean {
  return Boolean(envRazorpayKeyId() && envRazorpayKeySecret());
}

export function missingRazorpayEnvVars(): string[] {
  const missing: string[] = [];
  if (!envRazorpayKeyId()) missing.push("RAZORPAY_KEY_ID");
  if (!envRazorpayKeySecret()) missing.push("RAZORPAY_KEY_SECRET");
  if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) missing.push("RAZORPAY_WEBHOOK_SECRET");
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

export async function getEnabledRazorpayGateway(): Promise<StorefrontGateway | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("payment_gateways")
    .select("id, provider, display_name, api_key_encrypted, api_secret_encrypted, sandbox")
    .eq("provider", "razorpay")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    const keyId = envRazorpayKeyId();
    const keySecret = envRazorpayKeySecret();
    if (keyId && keySecret) {
      return {
        id: "env",
        provider: "razorpay",
        displayName: "Razorpay",
        keyId,
        keySecret,
        sandbox: process.env.NODE_ENV !== "production",
      };
    }
    return null;
  }

  return {
    id: data.id,
    provider: data.provider,
    displayName: data.display_name,
    keyId: decodeSecret(data.api_key_encrypted),
    keySecret: decodeSecret(data.api_secret_encrypted),
    sandbox: data.sandbox,
  };
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
  if (process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) return true;

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

  return Boolean(decodeSecret(data?.webhook_secret_encrypted));
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
