import type { CarrierProvider } from "../shipping-types";
import { createDelhiveryAdapter } from "./delhivery";
import { getDelhiveryConfig } from "@/lib/delhivery/config";

export interface CreateShipmentParams {
  orderId: string;
  orderNumber: string;
  weightGrams?: number | null;
  dimensions?: Record<string, unknown>;
  codAmount?: number;
  destination: {
    name: string;
    phone?: string | null;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface CarrierShipmentResult {
  trackingNumber: string;
  awbNumber: string;
  labelUrl: string;
  raw?: Record<string, unknown>;
}

export interface PickupScheduleParams {
  warehouseName: string;
  pickupDate: string;
  packageCount?: number;
}

export interface CarrierPickupResult {
  reference: string;
  raw?: Record<string, unknown>;
}

export interface CarrierAdapter {
  readonly provider: CarrierProvider;
  createShipment(params: CreateShipmentParams): Promise<CarrierShipmentResult>;
  cancelShipment(trackingNumber: string): Promise<void>;
  schedulePickup(params: PickupScheduleParams): Promise<CarrierPickupResult>;
  reprintLabel(trackingNumber: string): Promise<{ labelUrl: string }>;
}

function placeholderLabel(provider: CarrierProvider, tracking: string) {
  return `/admin/shipping/labels/placeholder?provider=${provider}&awb=${encodeURIComponent(tracking)}`;
}

function mockTracking(provider: CarrierProvider) {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${provider.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}${rand}`;
}

export function createPlaceholderAdapter(provider: CarrierProvider): CarrierAdapter {
  return {
    provider,
    async createShipment(params) {
      const trackingNumber = mockTracking(provider);
      return {
        trackingNumber,
        awbNumber: trackingNumber,
        labelUrl: placeholderLabel(provider, trackingNumber),
        raw: { placeholder: true, order_id: params.orderId, provider },
      };
    },
    async cancelShipment() {
      /* placeholder — no external API call */
    },
    async schedulePickup(params) {
      return {
        reference: `PKP-${provider}-${params.pickupDate.replace(/-/g, "")}`,
        raw: { placeholder: true, ...params },
      };
    },
    async reprintLabel(trackingNumber) {
      return { labelUrl: placeholderLabel(provider, trackingNumber) };
    },
  };
}

export const CARRIER_ADAPTERS: Record<CarrierProvider, CarrierAdapter> = {
  delhivery: createPlaceholderAdapter("delhivery"),
  shiprocket: createPlaceholderAdapter("shiprocket"),
  blue_dart: createPlaceholderAdapter("blue_dart"),
  xpressbees: createPlaceholderAdapter("xpressbees"),
  india_post: createPlaceholderAdapter("india_post"),
  dtdc: createPlaceholderAdapter("dtdc"),
  ekart: createPlaceholderAdapter("ekart"),
  amazon_shipping: createPlaceholderAdapter("amazon_shipping"),
  custom: createPlaceholderAdapter("custom"),
};

export function getCarrierAdapter(provider: CarrierProvider): CarrierAdapter {
  if (provider === "delhivery" && getDelhiveryConfig().isConfigured) {
    return createDelhiveryAdapter();
  }
  return CARRIER_ADAPTERS[provider] ?? CARRIER_ADAPTERS.custom;
}
