import { TrustIcon } from "@/components/trust/TrustIcons";
import { trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const ITEMS = [
  { icon: "shield-check", label: "Dermatologically Tested" },
  { icon: "factory", label: "Made in India" },
  { icon: "heart-pulse", label: "Cruelty Free" },
  { icon: "leaf", label: "Natural Ingredients" },
  { icon: "beaker", label: "Research Backed" },
  { icon: "truck", label: "Fast Shipping" },
  { icon: "rotate-ccw", label: "Easy Returns" },
] as const;

const PANEL_ITEMS = [
  { icon: "shield-check", label: "Dermatologically Tested" },
  { icon: "factory", label: "Made in India" },
  { icon: "leaf", label: "Natural Ingredients" },
  { icon: "beaker", label: "Research Backed" },
  { icon: "truck", label: "Fast Shipping" },
  { icon: "rotate-ccw", label: "Easy Returns" },
] as const;

type CommerceTrustStripProps = {
  variant?: "compact" | "full" | "panel";
  className?: string;
};

export default function CommerceTrustStrip({
  variant = "full",
  className,
}: CommerceTrustStripProps) {
  if (variant === "panel") {
    return (
      <div className={cn("pdp-trust-panel", className)} aria-label="Product quality guarantees">
        <ul className="contents">
          {PANEL_ITEMS.map((item) => (
            <li key={item.label} className="pdp-trust-panel-item">
              <TrustIcon name={item.icon} className={cn(trustIconSize, "mt-0.5 text-green-700")} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-green-100/80 bg-white/85 backdrop-blur-sm",
        variant === "compact" ? "py-3" : "py-4",
        className,
      )}
    >
      <ul
        className={cn(
          "flex gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          variant === "compact" ? "snap-x snap-mandatory" : "flex-wrap justify-center lg:gap-3",
        )}
        aria-label="Shopping guarantees"
      >
        {ITEMS.map((item) => (
          <li
            key={item.label}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border border-green-100 bg-cream-50/90 px-3 py-1.5",
              variant === "compact" && "snap-start",
            )}
          >
            <TrustIcon name={item.icon} className={cn(trustIconSize, "text-green-700")} />
            <span className="whitespace-nowrap text-[11px] font-semibold text-green-800 sm:text-xs">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
