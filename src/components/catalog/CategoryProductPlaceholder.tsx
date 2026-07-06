import {
  CATEGORY_PLACEHOLDER_GRADIENTS,
  CATEGORY_PLACEHOLDER_LABELS,
  resolveProductVisualGroup,
  type ProductVisualGroup,
} from "@/lib/catalog/product-category-images";
import { cn } from "@/lib/utils";

type CategoryProductPlaceholderProps = {
  productName?: string;
  categorySlug?: string | null;
  productSlug?: string;
  className?: string;
  compact?: boolean;
};

export default function CategoryProductPlaceholder({
  productName,
  categorySlug,
  productSlug,
  className,
  compact = false,
}: CategoryProductPlaceholderProps) {
  const group = resolveProductVisualGroup(categorySlug, productSlug);

  if (group === "wipes") {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-end overflow-hidden p-6 text-center",
          className,
        )}
        style={{
          background: "linear-gradient(145deg, #ecfdf5 0%, #6ee7b7 45%, #d1fae5 100%)",
        }}
        role="img"
        aria-label={productName ? `${productName} — Baby Wipes` : "Baby Wipes"}
      >
        <p className={cn("font-heading font-bold text-green-950/85", compact ? "text-sm" : "text-lg sm:text-xl")}>
          {productName ?? "Baby Wipes"}
        </p>
      </div>
    );
  }

  const visualGroup = group;
  const gradient =
    CATEGORY_PLACEHOLDER_GRADIENTS[visualGroup as Exclude<ProductVisualGroup, "wipes">];
  const categoryLabel =
    CATEGORY_PLACEHOLDER_LABELS[visualGroup as Exclude<ProductVisualGroup, "wipes">];

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-end overflow-hidden p-6 text-center",
        className,
      )}
      style={{ background: gradient }}
      role="img"
      aria-label={productName ? `${productName} — ${categoryLabel}` : categoryLabel}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.55) 0%, transparent 40%)",
        }}
      />
      <p
        className={cn(
          "relative z-[1] font-heading font-bold leading-tight text-green-950/85",
          compact ? "text-sm" : "text-lg sm:text-xl",
        )}
      >
        {productName ?? categoryLabel}
      </p>
      {!compact && productName ? (
        <p className="relative z-[1] mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-green-900/55">
          {categoryLabel}
        </p>
      ) : null}
    </div>
  );
}
