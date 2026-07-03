import Badge from "@/components/ui/Badge";
import { displayPaymentStatus } from "@/lib/admin/payment-types";
import type { PaymentStatus } from "@/lib/supabase/database.types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const VARIANT: Partial<Record<PaymentStatus, BadgeVariant>> = {
  pending: "warning",
  authorized: "info",
  captured: "success",
  paid: "success",
  failed: "default",
  cancelled: "default",
  refunded: "default",
  partially_refunded: "warning",
  voided: "default",
};

export default function PaymentStatusBadge({
  status,
  size = "sm",
}: {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={VARIANT[status] ?? "default"} size={size}>
      {displayPaymentStatus(status)}
    </Badge>
  );
}
