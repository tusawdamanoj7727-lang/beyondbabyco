import { MRP_INCLUSIVE_TAX_LABEL } from "@/lib/catalog/gst-rates";
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
  const roundedRate = Number.isInteger(gstRate) ? gstRate : gstRate.toFixed(2);

  return (
    <p className={cn("text-sm text-gray-500", className)}>
      {showMrpLabel ? (
        <>
          <span className="font-medium text-gray-600">{MRP_INCLUSIVE_TAX_LABEL}</span>
          <span className="text-gray-400"> · </span>
        </>
      ) : null}
      Inclusive of {roundedRate}% GST
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

/** Short GST line for compact surfaces (mini cart, cards). */
export function GstInclusiveLabel({
  gstRate = 12,
  className,
}: {
  gstRate?: number;
  className?: string;
}) {
  const roundedRate = Number.isInteger(gstRate) ? gstRate : gstRate.toFixed(2);
  return (
    <span className={cn("text-xs text-gray-500", className)}>Inclusive of {roundedRate}% GST</span>
  );
}
