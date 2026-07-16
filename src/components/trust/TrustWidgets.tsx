import Link from "next/link";

import { focusRing, motionCard, transitionColorsFast, trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import { TRUST_WIDGETS } from "@/lib/trust";
import { TrustIcon } from "@/components/trust/TrustIcons";

type TrustWidgetsProps = {
  variant?: "strip" | "grid";
  className?: string;
};

export default function TrustWidgets({ variant = "strip", className = "" }: TrustWidgetsProps) {
  if (variant === "grid") {
    return (
      <section
        aria-label="Trust guarantees"
        className={`homepage-trust-strip border-y border-green-100/90 bg-cream-50/90 py-5 sm:py-6 ${className}`}
      >
        <div className="container">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            {TRUST_WIDGETS.map((widget) => {
              const inner = (
                <>
                  <span className="quality-icon-box-sm">
                    <TrustIcon name={widget.icon} className={cn(trustIconSize, "text-green-700")} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-xs font-bold text-green-900 sm:text-sm">{widget.label}</p>
                    <p className="mt-0.5 hidden font-body text-xs text-green-700 sm:block">{widget.description}</p>
                  </div>
                </>
              );

              return (
                <li key={widget.id}>
                  {widget.href ? (
                    <Link
                      href={widget.href}
                      className={cn(
                        motionCard,
                        "interactive-lift flex items-center gap-2 rounded-2xl border border-green-100/90 bg-white/92 px-3 py-2.5 sm:px-4",
                        transitionColorsFast,
                        "hover:border-green-300",
                        focusRing,
                      )}
                      title={widget.description}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-2 rounded-2xl border border-green-100/90 bg-white/92 px-3 py-2.5 sm:px-4"
                      title={widget.description}
                    >
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Trust guarantees"
      className={`homepage-trust-strip border-y border-green-100/90 bg-cream-50/90 py-4 sm:py-5 ${className}`}
    >
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 md:gap-x-8">
          {TRUST_WIDGETS.map((widget, index) => {
            const item = widget.href ? (
              <Link
                href={widget.href}
                className={cn(
                  "homepage-trust-item rounded-lg px-1 py-0.5",
                  transitionColorsFast,
                  "hover:text-green-900",
                  focusRing,
                )}
                title={widget.description}
              >
                <TrustIcon name={widget.icon} className={cn(trustIconSize, "text-green-700")} />
                <span className="font-heading text-xs font-bold text-green-900 sm:text-sm">{widget.label}</span>
              </Link>
            ) : (
              <div className="homepage-trust-item px-1 py-0.5" title={widget.description}>
                <TrustIcon name={widget.icon} className={cn(trustIconSize, "text-green-700")} />
                <span className="font-heading text-xs font-bold text-green-900 sm:text-sm">{widget.label}</span>
              </div>
            );

            return (
              <li key={widget.id} className="flex items-center gap-4 sm:gap-6 md:gap-8">
                {index > 0 ? <span aria-hidden="true" className="homepage-trust-separator" /> : null}
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
