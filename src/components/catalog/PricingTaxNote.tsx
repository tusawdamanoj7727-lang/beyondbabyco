import { formatInr } from "@/lib/catalog/format";
import { calcCheckoutTax } from "@/lib/checkout/tax";
import { cn } from "@/lib/utils";

type PricingTaxNoteProps = {
  className?: string;
  /** When set, shows estimated GST amount alongside the disclosure. */
  taxableAmount?: number;
};

export default function PricingTaxNote({ className, taxableAmount }: PricingTaxNoteProps) {
  const estimatedGst =
    taxableAmount != null && taxableAmount > 0 ? calcCheckoutTax(taxableAmount) : null;

  return (
    <p className={cn("text-xs leading-relaxed text-green-700/75", className)}>
      GST (18%) calculated at checkout
      {estimatedGst != null ? (
        <span className="text-green-700/65"> · Estimated {formatInr(estimatedGst)}</span>
      ) : null}
    </p>
  );
}
