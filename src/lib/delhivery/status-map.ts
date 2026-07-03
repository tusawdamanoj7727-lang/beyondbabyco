import type { ShipmentStatus } from "@/lib/supabase/database.types";

/** Map Delhivery scan/status strings to internal shipment_status. */
export function mapDelhiveryStatus(raw: string): ShipmentStatus {
  const s = raw.toLowerCase();

  if (s.includes("deliver") && !s.includes("out for")) return "delivered";
  if (s.includes("out for delivery") || s.includes("ofd")) return "out_for_delivery";
  if (s.includes("transit") || s.includes("dispatched") || s.includes("shipped")) return "in_transit";
  if (s.includes("manifest") || s.includes("pickup") || s.includes("scheduled")) return "label_created";
  if (s.includes("cancel") || s.includes("rto") || s.includes("return")) return "returned";
  if (s.includes("fail") || s.includes("undelivered") || s.includes("ndr")) return "failed";

  return "pending";
}
