import Badge from "@/components/ui/Badge";
import type { CampaignStatus, QueueStatus } from "@/lib/admin/marketing-types";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/admin/marketing-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const CAMPAIGN_VARIANTS: Record<CampaignStatus, BadgeVariant> = {
  draft: "default",
  scheduled: "info",
  running: "success",
  paused: "warning",
  completed: "success",
  cancelled: "warning",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={CAMPAIGN_VARIANTS[status]} size="sm">{CAMPAIGN_STATUS_LABELS[status]}</Badge>;
}

const QUEUE_VARIANTS: Record<QueueStatus, BadgeVariant> = {
  queued: "info",
  processing: "warning",
  sent: "success",
  failed: "warning",
};

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const labels: Record<QueueStatus, string> = { queued: "Queued", processing: "Processing", sent: "Sent", failed: "Failed" };
  return <Badge variant={QUEUE_VARIANTS[status]} size="sm">{labels[status]}</Badge>;
}
