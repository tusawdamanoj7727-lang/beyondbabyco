import Badge from "@/components/ui/Badge";
import {
  STOCK_STATUS_LABELS,
  type StockDisplayStatus,
} from "@/lib/admin/inventory-types";

const VARIANT: Record<StockDisplayStatus, "default" | "success" | "warning" | "info" | "comingSoon"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "default",
  incoming: "info",
};

export default function InventoryStatusBadge({
  status,
  size = "sm",
}: {
  status: StockDisplayStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}
