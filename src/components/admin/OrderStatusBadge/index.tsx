import Badge from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS, type AdminOrderStatus } from "@/lib/admin/order-types";
import type { OrderStatus } from "@/lib/supabase/database.types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const VARIANT: Record<AdminOrderStatus, BadgeVariant> = {
  draft: "default",
  pending: "warning",
  confirmed: "info",
  packed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  completed: "success",
  cancelled: "default",
  returned: "warning",
  refunded: "default",
};

export default function OrderStatusBadge({
  status,
  size = "sm",
}: {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
}) {
  const label = ORDER_STATUS_LABELS[status as AdminOrderStatus] ?? status;
  const variant = VARIANT[status as AdminOrderStatus] ?? "default";
  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
