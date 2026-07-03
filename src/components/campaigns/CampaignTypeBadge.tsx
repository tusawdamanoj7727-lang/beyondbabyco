import {
  MARKETING_CAMPAIGN_TYPE_LABELS,
  type MarketingCampaignType,
} from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Partial<Record<MarketingCampaignType, string>> = {
  product_launch: "bg-green-100 text-green-800",
  festival: "bg-amber-100 text-amber-800",
  flash_sale: "bg-red-100 text-red-800",
  coupon: "bg-terra-100 text-terra-800",
  newsletter: "bg-cream-100 text-green-800",
};

export default function CampaignTypeBadge({
  type,
  className,
}: {
  type: MarketingCampaignType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TYPE_COLORS[type] ?? "bg-cream-100 text-green-800",
        className,
      )}
    >
      {MARKETING_CAMPAIGN_TYPE_LABELS[type]}
    </span>
  );
}
