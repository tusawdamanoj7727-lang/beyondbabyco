import Badge from "@/components/ui/Badge";
import { REVIEW_STATUS_LABELS, type ReviewStatus } from "@/lib/admin/review-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const VARIANT: Record<ReviewStatus, BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "default",
  hidden: "default",
  spam: "default",
};

export default function ReviewStatusBadge({
  status,
  size = "sm",
}: {
  status: ReviewStatus;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}
