import "server-only";

import { getDelhiveryConfig, requireDelhiveryConfig } from "./config";
import type {
  DelhiveryCancelResult,
  DelhiveryCreateShipmentPayload,
  DelhiveryCreateShipmentResult,
  DelhiveryLabelResult,
  DelhiveryPickupRequest,
  DelhiveryPickupResult,
  DelhiveryServiceabilityResult,
  DelhiveryTrackingResult,
  DelhiveryTrackingScan,
  DelhiveryWaybillResult,
} from "./types";

const MAX_RETRIES = 2;

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Token ${apiKey}`,
    Accept: "application/json",
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function delhiveryFetch(
  path: string,
  init: RequestInit & { retry?: boolean } = {},
): Promise<Response> {
  const config = requireDelhiveryConfig();
  const url = `${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const { retry = true, ...fetchInit } = init;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= (retry ? MAX_RETRIES : 0); attempt++) {
    try {
      const res = await fetch(url, {
        ...fetchInit,
        headers: {
          ...authHeaders(config.apiKey),
          ...(fetchInit.headers ?? {}),
        },
        cache: "no-store",
      });
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) await sleep(400 * (attempt + 1));
    }
  }
  throw lastError ?? new Error("Delhivery request failed");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/** Validates API key presence (Delhivery uses static token auth). */
export function authenticate(): { ok: boolean; baseUrl: string } {
  const config = getDelhiveryConfig();
  return { ok: config.isConfigured, baseUrl: config.baseUrl };
}

export async function checkServiceability(pincode: string): Promise<DelhiveryServiceabilityResult> {
  const res = await delhiveryFetch(
    `/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`,
    { method: "GET" },
  );
  const raw = asRecord(await res.json().catch(() => ({})));
  const deliveryCodes = Array.isArray(raw.delivery_codes) ? raw.delivery_codes : [];
  const first = deliveryCodes[0] as Record<string, unknown> | undefined;

  const prepaid = first?.pre_paid === "Y" || first?.prepaid === "Y";
  const cod = first?.cod === "Y";
  const serviceable = Boolean(first) && (prepaid || cod);

  return {
    pincode,
    serviceable,
    cod,
    prepaid,
    raw,
  };
}

export async function getWaybill(count = 1): Promise<DelhiveryWaybillResult> {
  const res = await delhiveryFetch(
    `/waybill/api/bulk/json/?count=${Math.min(Math.max(count, 1), 50)}`,
    { method: "GET" },
  );
  const raw = asRecord(await res.json().catch(() => ({})));
  const waybills = Array.isArray(raw.waybill) ? raw.waybill.map(String) : [];

  return { waybills, raw };
}

export async function createShipment(
  payload: DelhiveryCreateShipmentPayload,
): Promise<DelhiveryCreateShipmentResult> {
  const body = new URLSearchParams({
    format: "json",
    data: JSON.stringify(payload),
  });

  const res = await delhiveryFetch("/api/cmu/create.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const raw = asRecord(await res.json().catch(() => ({})));
  const packages = Array.isArray(raw.packages) ? raw.packages : [];
  const pkg = asRecord(packages[0]);
  const remarks = Array.isArray(raw.remarks) ? raw.remarks.map(String) : [];

  return {
    success: res.ok && (pkg.status === "Success" || Boolean(pkg.waybill)),
    waybill: pkg.waybill ? String(pkg.waybill) : null,
    orderId: pkg.refnum ? String(pkg.refnum) : null,
    status: pkg.status ? String(pkg.status) : null,
    remarks,
    raw,
  };
}

export async function trackShipment(waybill: string): Promise<DelhiveryTrackingResult> {
  const res = await delhiveryFetch(
    `/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
    { method: "GET" },
  );
  const raw = asRecord(await res.json().catch(() => ({})));
  const shipmentData = Array.isArray(raw.ShipmentData) ? raw.ShipmentData : [];
  const first = asRecord(shipmentData[0]);
  const shipment = asRecord(first.Shipment);
  const scansRaw = Array.isArray(shipment.Scans) ? shipment.Scans : [];

  const scans: DelhiveryTrackingScan[] = scansRaw.map((scan) => {
    const item = asRecord(scan);
    const detail = asRecord(item.ScanDetail ?? item);
    return {
      status: String(detail.Scan ?? detail.Status ?? ""),
      statusCode: detail.StatusCode ? String(detail.StatusCode) : null,
      location: detail.ScannedLocation ? String(detail.ScannedLocation) : null,
      message: detail.Instructions ? String(detail.Instructions) : null,
      timestamp: detail.ScanDateTime ? String(detail.ScanDateTime) : null,
    };
  });

  const statusObj = asRecord(shipment.Status ?? shipment.status);
  return {
    waybill,
    status: String(statusObj.Status ?? statusObj.status ?? "unknown"),
    expectedDelivery: shipment.ExpectedDeliveryDate
      ? String(shipment.ExpectedDeliveryDate)
      : null,
    scans,
    raw,
  };
}

export async function cancelShipment(waybill: string): Promise<DelhiveryCancelResult> {
  const body = new URLSearchParams({
    format: "json",
    data: JSON.stringify({ waybill, cancellation: "true" }),
  });

  const res = await delhiveryFetch("/api/p/edit", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const raw = asRecord(await res.json().catch(() => ({})));
  const status = raw.status ? String(raw.status) : null;

  return {
    success: res.ok && status !== "Failure",
    message: raw.remark ? String(raw.remark) : status,
    raw,
  };
}

export async function generateLabel(waybill: string): Promise<DelhiveryLabelResult> {
  const config = requireDelhiveryConfig();
  const res = await delhiveryFetch(
    `/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}`,
    { method: "GET", headers: { Accept: "application/json" } },
  );

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    const buffer = await res.arrayBuffer();
    const pdfBase64 = Buffer.from(buffer).toString("base64");
    return {
      labelUrl: null,
      pdfBase64,
      raw: { contentType },
    };
  }

  const raw = asRecord(await res.json().catch(() => ({})));
  const packages = Array.isArray(raw.packages) ? raw.packages : [];
  const pkg = asRecord(packages[0]);
  const labelUrl = pkg.pdf_download_link
    ? String(pkg.pdf_download_link)
    : pkg.barcode
      ? `${config.baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}`
      : null;

  return { labelUrl, pdfBase64: null, raw };
}

export async function requestPickup(input: DelhiveryPickupRequest): Promise<DelhiveryPickupResult> {
  const config = requireDelhiveryConfig();
  const payload = {
    pickup_time: input.pickupTime,
    pickup_date: input.pickupDate,
    pickup_location: input.pickupLocation || config.pickupLocation,
    expected_package_count: input.expectedPackageCount,
  };

  const res = await delhiveryFetch("/fm/request/new/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = asRecord(await res.json().catch(() => ({})));
  const pickupId = raw.pickup_id ? String(raw.pickup_id) : raw.pickup_location_name ? String(raw.pickup_location_name) : null;

  return {
    success: res.ok,
    pickupId,
    raw,
  };
}
