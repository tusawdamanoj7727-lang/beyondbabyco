import { cn } from "@/lib/utils";

export type RatingStarsProps = {
  rating: number;
  max?: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  className?: string;
  /** When true, each star is individually labeled for screen readers. */
  detailed?: boolean;
};

function starSizeClass(size: RatingStarsProps["size"]) {
  switch (size) {
    case "lg":
      return "text-lg tracking-[0.16em]";
    case "md":
      return "text-base tracking-[0.14em]";
    case "sm":
    default:
      return "text-sm tracking-[0.12em]";
  }
}

function countSizeClass(size: RatingStarsProps["size"]) {
  return size === "lg" ? "text-sm" : size === "md" ? "text-sm" : "text-xs";
}

export default function RatingStars({
  rating,
  max = 5,
  count,
  size = "sm",
  label,
  showValue = false,
  className,
  detailed = false,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(max, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75;
  const roundedUp = clamped - fullStars >= 0.75 ? 1 : 0;
  const displayFull = Math.min(max, fullStars + roundedUp);
  const displayHalf = hasHalf && displayFull < max;
  const empty = max - displayFull - (displayHalf ? 1 : 0);

  const ariaLabel =
    label ?? `${clamped.toFixed(1)} out of ${max} stars${count != null ? `, ${count} reviews` : ""}`;

  if (detailed) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)} role="img" aria-label={ariaLabel}>
        <span className={cn("inline-flex leading-none text-terra-500", starSizeClass(size))} aria-hidden="true">
          {Array.from({ length: max }, (_, i) => {
            const n = i + 1;
            const filled = n <= displayFull;
            const half = displayHalf && n === displayFull + 1;
            return (
              <span key={n} className={cn(half && "opacity-70")}>
                {filled ? "★" : half ? "⯨" : "☆"}
              </span>
            );
          })}
        </span>
        {showValue ? (
          <span className={cn("font-semibold text-green-900", countSizeClass(size))}>{clamped.toFixed(1)}</span>
        ) : null}
        {count != null ? (
          <span className={cn("text-green-700", countSizeClass(size))}>({count.toLocaleString("en-IN")})</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)} role="img" aria-label={ariaLabel}>
      <span className={cn("leading-none text-terra-500", starSizeClass(size))} aria-hidden="true">
        {"★".repeat(displayFull)}
        {displayHalf ? "⯨" : ""}
        {"☆".repeat(empty)}
      </span>
      {showValue ? (
        <span className={cn("font-semibold text-green-900", countSizeClass(size))}>{clamped.toFixed(1)}</span>
      ) : null}
      {count != null ? (
        <span className={cn("text-green-700", countSizeClass(size))}>({count.toLocaleString("en-IN")})</span>
      ) : null}
    </div>
  );
}
