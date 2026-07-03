import Badge from "@/components/ui/Badge";
import { CUSTOMER_STATUS_LABELS, type CustomerStatus } from "@/lib/admin/customer-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const VARIANT: Record<CustomerStatus, BadgeVariant> = {
  active: "success",
  inactive: "warning",
  deleted: "default",
};

export default function CustomerStatusBadge({
  status,
  size = "sm",
}: {
  status: CustomerStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  );
}
