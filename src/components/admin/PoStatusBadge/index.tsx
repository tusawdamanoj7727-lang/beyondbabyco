import Badge from "@/components/ui/Badge";
import { PO_STATUS_LABELS, type PoStatus } from "@/lib/admin/inventory-types";

const VARIANT: Record<PoStatus, "default" | "success" | "warning" | "info" | "comingSoon"> = {
  draft: "default",
  sent: "info",
  received: "success",
  cancelled: "warning",
};

export default function PoStatusBadge({ status, size = "sm" }: { status: PoStatus; size?: "sm" | "md" | "lg" }) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {PO_STATUS_LABELS[status]}
    </Badge>
  );
}
