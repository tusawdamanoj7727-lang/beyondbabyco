import "server-only";

import {
  getTracking,
  listCarriers,
  listRates,
  listShippingShipments,
  listZones,
} from "@/lib/admin/shipping";
import type {
  CarrierListItem,
  RateListItem,
  ShipmentLogisticsItem,
  TrackingEventItem,
  ZoneListItem,
} from "@/lib/admin/shipping-types";

export type { CarrierListItem, ZoneListItem, RateListItem, TrackingEventItem, ShipmentLogisticsItem };

export async function getShippingCarriers(): Promise<CarrierListItem[]> {
  return listCarriers();
}

export async function getShippingZones(): Promise<ZoneListItem[]> {
  return listZones();
}

export async function getShippingRates(zoneId?: string): Promise<RateListItem[]> {
  return listRates(zoneId);
}

export { getTracking };

export async function getShipments(opts?: { limit?: number }) {
  const result = await listShippingShipments({ perPage: opts?.limit ?? 50, page: 1 });
  return result.rows;
}
