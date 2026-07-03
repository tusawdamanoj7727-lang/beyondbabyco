import Link from "next/link";

import { Mascot, type MascotType } from "@/components/mascots";
import Button from "@/components/ui/Button";
import { ctaHeight } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type CatalogEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  mascot?: MascotType;
  className?: string;
};

export default function CatalogEmptyState({
  title,
  description,
  actionLabel = "Browse all products",
  actionHref = "/products",
  secondaryLabel,
  secondaryHref,
  mascot = "poppy-panda",
  className,
}: CatalogEmptyStateProps) {
  return (
    <div className={cn("mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center", className)}>
      <div className="collection-empty-state w-full">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <Mascot mascot={mascot} pose="peek" size={128} animated floating alt="" />
        </div>
        <h2 className="mt-6 font-heading text-[clamp(1.375rem,2.5vw,1.75rem)] font-bold text-green-900">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-[1.75] text-green-700/88">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" type="button" className={cn(ctaHeight, "font-semibold")}>
                {actionLabel}
              </Button>
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button variant="outline" type="button" className={cn(ctaHeight, "font-semibold")}>
                {secondaryLabel}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
