"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import CourierBadge from "@/components/shipping/CourierBadge";
import type { ShipmentStatus } from "@/lib/supabase/database.types";

interface Props {
  orderId: string;
  shipment: {
    id: string;
    trackingNumber: string | null;
    labelUrl: string | null;
    status: ShipmentStatus;
    pickupStatus: string | null;
  } | null;
  courierLogs?: {
    id: string;
    action: string;
    success: boolean;
    errorMessage: string | null;
    statusCode: number | null;
    createdAt: string;
  }[];
}

async function callApi(path: string, body?: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function DelhiveryShipmentPanel({ orderId, shipment, courierLogs = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trackingNumber = shipment?.trackingNumber;

  function run(action: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage("Done.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-lg font-bold text-green-900">Delhivery</h3>
        <CourierBadge />
        {shipment && <ShipmentStatusBadge status={shipment.status} size="sm" />}
      </div>

      {trackingNumber && (
        <p className="text-sm text-green-800">
          Tracking: <span className="font-mono font-semibold">{trackingNumber}</span>
        </p>
      )}
      {shipment?.pickupStatus && (
        <p className="text-sm text-green-700/70">Pickup: {shipment.pickupStatus}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!shipment && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await callApi("/api/delhivery/create-order", { orderId });
              })
            }
          >
            Create Shipment
          </Button>
        )}
        {shipment && !trackingNumber && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await callApi("/api/delhivery/create-order", { orderId, shipmentId: shipment.id });
              })
            }
          >
            Generate AWB
          </Button>
        )}
        {trackingNumber && (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await fetch(`/api/delhivery/track?waybill=${encodeURIComponent(trackingNumber)}&shipmentId=${shipment!.id}`);
                })
              }
            >
              Refresh Tracking
            </Button>
            <a
              href={`/api/delhivery/label?waybill=${encodeURIComponent(trackingNumber)}&shipmentId=${shipment!.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Print Label
            </a>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const today = new Date().toISOString().slice(0, 10);
                  await callApi("/api/delhivery/pickup", {
                    shipmentId: shipment!.id,
                    pickupDate: today,
                  });
                })
              }
            >
              Schedule Pickup
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await callApi("/api/delhivery/cancel", {
                    waybill: trackingNumber,
                    shipmentId: shipment!.id,
                  });
                })
              }
            >
              Cancel Shipment
            </Button>
          </>
        )}
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {courierLogs.length > 0 && (
        <div className="border-t border-cream-200 pt-4">
          <h4 className="mb-2 text-sm font-semibold text-green-900">Courier logs</h4>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {courierLogs.map((log) => (
              <li
                key={log.id}
                className={`rounded-xl px-3 py-2 ${log.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
              >
                <span className="font-medium">{log.action}</span>
                {log.statusCode != null && <span className="ml-2 opacity-70">({log.statusCode})</span>}
                {log.errorMessage && <p className="mt-0.5">{log.errorMessage}</p>}
                <p className="mt-0.5 opacity-60">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
