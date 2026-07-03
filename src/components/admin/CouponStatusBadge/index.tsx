import Badge from "@/components/ui/Badge";
import {
  COUPON_LIFECYCLE_LABELS,
  COUPON_TYPE_LABELS,
  type CouponDisplayStatus,
  type CouponLifecycle,
  type CouponType,
} from "@/lib/admin/coupon-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const DISPLAY_VARIANT: Record<CouponDisplayStatus, BadgeVariant> = {
  active: "success",
  scheduled: "info",
  expired: "default",
  inactive: "warning",
  archived: "default",
};

const DISPLAY_LABELS: Record<CouponDisplayStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  inactive: "Inactive",
  archived: "Archived",
};

export function CouponDisplayBadge({
  status,
  size = "sm",
}: {
  status: CouponDisplayStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={DISPLAY_VARIANT[status]} size={size}>
      {DISPLAY_LABELS[status]}
    </Badge>
  );
}

export function CouponTypeBadge({ type, size = "sm" }: { type: CouponType; size?: "sm" | "md" | "lg" }) {
  return (
    <Badge variant="info" size={size}>
      {COUPON_TYPE_LABELS[type]}
    </Badge>
  );
}

export function CouponLifecycleBadge({ status, size = "sm" }: { status: CouponLifecycle; size?: "sm" | "md" | "lg" }) {
  const variant: BadgeVariant = status === "active" ? "success" : status === "archived" ? "default" : "warning";
  return (
    <Badge variant={variant} size={size}>
      {COUPON_LIFECYCLE_LABELS[status]}
    </Badge>
  );
}

export default CouponDisplayBadge;
