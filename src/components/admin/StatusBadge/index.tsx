import Badge from "@/components/ui/Badge";
import type { ProductStatus } from "@/lib/supabase/database.types";
import { STATUS_LABELS } from "@/lib/admin/product-schema";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  active: "success",
  draft: "default",
  archived: "warning",
  coming_soon: "comingSoon",
};

export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: ProductStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} size={size}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
