import "server-only";

import { getGa4MeasurementId } from "@/lib/analytics/config";

/**
 * GA4 Measurement Protocol — server-side events (refunds, offline conversions).
 * Requires GA4_API_SECRET + NEXT_PUBLIC_GA4_MEASUREMENT_ID on Vercel Production.
 */
function getGa4ApiSecret(): string | null {
  return process.env.GA4_API_SECRET?.trim() || null;
}

export async function sendGa4MeasurementEvent(input: {
  name: string;
  clientId?: string;
  params?: Record<string, unknown>;
}): Promise<boolean> {
  const measurementId = getGa4MeasurementId();
  const apiSecret = getGa4ApiSecret();
  if (!measurementId || !apiSecret) return false;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: input.clientId ?? `server.${Date.now()}`,
        events: [
          {
            name: input.name,
            params: {
              currency: "INR",
              ...input.params,
            },
          },
        ],
      }),
      cache: "no-store",
    });
    return res.ok;
  } catch (error) {
    console.warn(
      JSON.stringify({
        scope: "analytics.measurement_protocol",
        event: input.name,
        error: error instanceof Error ? error.message : "unknown",
      }),
    );
    return false;
  }
}

export function trackServerRefund(input: {
  transactionId: string;
  value?: number;
  currency?: string;
}): void {
  void sendGa4MeasurementEvent({
    name: "refund",
    params: {
      transaction_id: input.transactionId,
      value: input.value,
      currency: input.currency ?? "INR",
    },
  });
}
