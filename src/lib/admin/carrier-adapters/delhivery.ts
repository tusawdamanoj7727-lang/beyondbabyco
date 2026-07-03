import "server-only";

import type { CarrierAdapter, CreateShipmentParams, CarrierShipmentResult } from "../carrier-adapters";
import { delhiveryCreateOrderShipment } from "@/lib/delhivery/service";
import { getDelhiveryConfig } from "@/lib/delhivery/config";

export function createDelhiveryAdapter(): CarrierAdapter {
  return {
    provider: "delhivery",
    async createShipment(params: CreateShipmentParams): Promise<CarrierShipmentResult> {
      const config = getDelhiveryConfig();
      if (!config.isConfigured) {
        throw new Error("Delhivery API is not configured.");
      }

      const result = await delhiveryCreateOrderShipment({
        orderId: params.orderId,
        weightGrams: params.weightGrams ?? undefined,
        codAmount: params.codAmount,
        paymentMode: params.codAmount && params.codAmount > 0 ? "COD" : "Prepaid",
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error ?? "Delhivery create shipment failed");
      }

      const waybill = String(result.data.waybill ?? result.data.awbNumber ?? "");
      return {
        trackingNumber: waybill,
        awbNumber: waybill,
        labelUrl: String(result.data.labelUrl ?? ""),
        raw: result.data,
      };
    },
    async cancelShipment(trackingNumber: string) {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const { delhiveryCancelOrderShipment } = await import("@/lib/delhivery/service");
      const supabase = await createSupabaseServerClient();
      const { data: shipment } = await supabase
        .from("shipments")
        .select("id, order_id")
        .eq("tracking_number", trackingNumber)
        .maybeSingle();
      if (!shipment) throw new Error("Shipment not found");
      const result = await delhiveryCancelOrderShipment({
        waybill: trackingNumber,
        shipmentId: shipment.id,
        orderId: shipment.order_id,
      });
      if (!result.ok) throw new Error(result.error ?? "Cancel failed");
    },
    async schedulePickup(params) {
      const { delhiverySchedulePickup } = await import("@/lib/delhivery/service");
      const result = await delhiverySchedulePickup({
        pickupDate: params.pickupDate,
        pickupLocation: params.warehouseName,
        expectedPackageCount: params.packageCount ?? 1,
      });
      if (!result.ok) throw new Error(result.error ?? "Pickup failed");
      return { reference: String(result.data?.pickupId ?? ""), raw: result.data };
    },
    async reprintLabel(trackingNumber: string) {
      const { delhiveryFetchLabel } = await import("@/lib/delhivery/service");
      const result = await delhiveryFetchLabel(trackingNumber);
      if (!result.ok) throw new Error(result.error ?? "Label fetch failed");
      return { labelUrl: String(result.data?.labelUrl ?? `/api/delhivery/label?waybill=${encodeURIComponent(trackingNumber)}`) };
    },
  };
}
