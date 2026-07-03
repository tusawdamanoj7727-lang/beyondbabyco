import Badge from "@/components/ui/Badge";
import {
  REFUND_STATUS_LABELS,
  RETURN_STATUS_LABELS,
  type RefundStatus,
  type ReturnStatus,
} from "@/lib/admin/return-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const STATUS_VARIANT: Record<ReturnStatus, BadgeVariant> = {
  requested: "warning",
  approved: "info",
  rejected: "default",
  pickup_scheduled: "info",
  received: "info",
  inspection: "warning",
  refund_approved: "success",
  refunded: "success",
  closed: "default",
};

const REFUND_VARIANT: Record<RefundStatus, BadgeVariant> = {
  pending: "warning",
  partial: "info",
  full: "success",
  store_credit: "info",
  gift_card: "info",
  refunded: "success",
  none: "default",
};

export function ReturnStatusBadge({
  status,
  size = "sm",
}: {
  status: ReturnStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} size={size}>
      {RETURN_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RefundStatusBadge({
  status,
  size = "sm",
}: {
  status: RefundStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={REFUND_VARIANT[status]} size={size}>
      {REFUND_STATUS_LABELS[status]}
    </Badge>
  );
}

export default ReturnStatusBadge;
