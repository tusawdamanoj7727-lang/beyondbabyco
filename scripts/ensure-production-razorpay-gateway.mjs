#!/usr/bin/env node
/**
 * Ensure production has a Razorpay payment_gateways row (env-backed secrets)
 * and backfill orphan payments.gateway_id.
 *
 * Usage:
 *   NEXT_PUBLIC_SITE_URL=https://beyondbabyco.in node scripts/ensure-production-razorpay-gateway.mjs
 */
import fs from "fs";
import path from "path";

function loadEnv(file) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site =
  process.env.NEXT_PUBLIC_SITE_URL?.includes("beyondbabyco.in")
    ? "https://beyondbabyco.in"
    : process.env.PRODUCTION_SITE_URL || "https://beyondbabyco.in";

function enc(value) {
  if (!value) return null;
  return value.startsWith("enc:") ? value : `enc:${value}`;
}

async function rest(pathname, init = {}) {
  const res = await fetch(`${url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: init.prefer || "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${pathname}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — cannot create gateway");
  }

  const existing = await rest(
    "payment_gateways?provider=eq.razorpay&is_enabled=eq.true&deleted_at=is.null&select=*&order=priority.desc&limit=1",
  );

  let gateway = Array.isArray(existing) ? existing[0] : null;

  if (!gateway) {
    const created = await rest("payment_gateways", {
      method: "POST",
      body: JSON.stringify({
        display_name: "Razorpay (Production)",
        provider: "razorpay",
        sandbox: false,
        currency: "INR",
        is_enabled: true,
        priority: 100,
        lifecycle_status: "active",
        api_key_encrypted: enc(keyId),
        api_secret_encrypted: enc(keySecret),
        webhook_secret_encrypted: enc(webhookSecret || null),
      }),
    });
    gateway = Array.isArray(created) ? created[0] : created;
    console.log("created_gateway", gateway.id);
  } else {
    console.log("existing_gateway", gateway.id);
  }

  // Canonical Dashboard URL uses the provider alias (resolves to gateway UUID in app).
  const webhookUrl = `${site}/api/webhooks/payments/razorpay`;
  const patch = {
    webhook_url: webhookUrl,
    sandbox: false,
    is_enabled: true,
    updated_at: new Date().toISOString(),
  };
  if (webhookSecret) {
    patch.webhook_secret_encrypted = enc(webhookSecret);
  }
  // Always sync API credentials from env (overwrite stale test keys in DB).
  patch.api_key_encrypted = enc(keyId);
  patch.api_secret_encrypted = enc(keySecret);
  patch.display_name = "Razorpay (Production)";
  patch.sandbox = keyId.startsWith("rzp_test_");

  const updated = await rest(`payment_gateways?id=eq.${gateway.id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  gateway = Array.isArray(updated) ? updated[0] : gateway;

  const orphans = await rest(`payments?provider=eq.razorpay&gateway_id=is.null&select=id`);
  const orphanIds = Array.isArray(orphans) ? orphans.map((p) => p.id) : [];
  let backfilled = 0;
  if (orphanIds.length) {
    const result = await rest(`payments?provider=eq.razorpay&gateway_id=is.null`, {
      method: "PATCH",
      body: JSON.stringify({ gateway_id: gateway.id }),
    });
    backfilled = Array.isArray(result) ? result.length : orphanIds.length;
  }

  const paid = await rest(`payments?provider=eq.razorpay&status=eq.paid&select=id`);
  const pending = await rest(`payments?provider=eq.razorpay&status=eq.pending&select=id`);
  const webhooks = await rest(`payment_webhooks?select=id&limit=5`);
  const gateways = await rest(
    `payment_gateways?provider=eq.razorpay&select=id,display_name,is_enabled,webhook_url,sandbox`,
  );

  console.log(
    JSON.stringify(
      {
        mode: "database_gateway_env_secrets",
        gatewayId: gateway.id,
        webhookUrl,
        webhookSecretConfigured: Boolean(webhookSecret || gateway.webhook_secret_encrypted),
        backfilledPayments: backfilled,
        razorpayPaid: Array.isArray(paid) ? paid.length : null,
        razorpayPending: Array.isArray(pending) ? pending.length : null,
        paymentWebhooksSample: Array.isArray(webhooks) ? webhooks.length : null,
        gateways,
        razorpayDashboardInstructions: [
          `Set webhook URL to: ${webhookUrl}`,
          "Enable payment.captured (and payment.authorized if used)",
          "Copy webhook secret into Vercel RAZORPAY_WEBHOOK_SECRET (Production)",
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
