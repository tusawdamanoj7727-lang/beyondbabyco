import Badge from "@/components/ui/Badge";
import { SHIPMENT_STATUS_LABELS } from "@/lib/admin/order-types";
import type { ShipmentStatus } from "@/lib/supabase/database.types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const VARIANT: Record<ShipmentStatus, BadgeVariant> = {
  pending: "warning",
  label_created: "info",
  in_transit: "info",
  out_for_delivery: "info",
  delivered: "success",
  failed: "default",
  returned: "warning",
};

export default function ShipmentStatusBadge({
  status,
  size = "sm",
}: {
  status: ShipmentStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {SHIPMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
