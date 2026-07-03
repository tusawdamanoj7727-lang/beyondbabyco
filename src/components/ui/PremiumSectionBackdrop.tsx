import { cn } from "@/lib/utils";

type PremiumSectionBackdropProps = {
  variant?: "cream" | "white" | "green";
  className?: string;
};

const GRADIENTS = {
  cream: "bg-[linear-gradient(180deg,var(--cream-50)_0%,color-mix(in_srgb,var(--cream-100)_65%,var(--cream-50))_100%)]",
  white:
    "bg-[linear-gradient(180deg,color-mix(in_srgb,white_55%,var(--cream-50))_0%,var(--cream-50)_100%)]",
  green:
    "bg-[linear-gradient(165deg,var(--cream-50)_0%,color-mix(in_srgb,var(--green-50)_35%,var(--cream-50))_100%)]",
} as const;

export default function PremiumSectionBackdrop({
  variant = "cream",
  className,
}: PremiumSectionBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 bg-cream-50", className)}
    >
      <div className={cn("absolute inset-0", GRADIENTS[variant])} />
    </div>
  );
}
