import { formatInr } from "@/lib/catalog/format";
import { formatGstRateLabel, MRP_INCLUSIVE_TAX_LABEL } from "@/lib/catalog/gst-rates";
import { cn } from "@/lib/utils";

type PricingTaxNoteProps = {
  className?: string;
  /** Product GST % — defaults to 12% baby care. */
  gstRate?: number;
  /** Show MRP inclusive label (product cards / PDP). */
  showMrpLabel?: boolean;
};

export default function PricingTaxNote({
  className,
  gstRate = 12,
  showMrpLabel = false,
}: PricingTaxNoteProps) {
  const rateLabel = formatGstRateLabel(gstRate);

  return (
    <p className={cn("text-xs leading-relaxed text-green-700/75", className)}>
      {showMrpLabel ? (
        <>
          <span className="font-medium text-green-800">{MRP_INCLUSIVE_TAX_LABEL}</span>
          <span className="text-green-700/65"> · </span>
        </>
      ) : null}
      {rateLabel} included in price
    </p>
  );
}

export function MrpInclusiveLabel({ className }: { className?: string }) {
  return (
    <span className={cn("text-[11px] font-medium text-green-700/70", className)}>
      {MRP_INCLUSIVE_TAX_LABEL}
    </span>
  );
}
