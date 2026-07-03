import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

function decodeSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("enc:") ? value.slice(4) : value;
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
    const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
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
