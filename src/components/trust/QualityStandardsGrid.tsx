import StaticSvgImage from "@/components/media/StaticSvgImage";
import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import { TrustIcon } from "@/components/trust/TrustIcons";
import { QUALITY_STANDARDS } from "@/lib/trust";
import { cn } from "@/lib/utils";

type QualityStandardsGridProps = {
  id?: string;
  compact?: boolean;
};

export default function QualityStandardsGrid({ id = "quality", compact = false }: QualityStandardsGridProps) {
  const items = compact ? QUALITY_STANDARDS.slice(0, 6) : QUALITY_STANDARDS;

  return (
    <section
      id={id}
      className="homepage-section scroll-reveal section-padding bg-cream-50"
      aria-labelledby="quality-standards-heading"
    >
      <div className="container">
        {!compact ? (
          <header className="homepage-section-header mx-auto max-w-3xl text-center">
            <Badge variant="default" size="md">
              Quality Standards
            </Badge>
            <h2 id="quality-standards-heading" className="section-heading homepage-section-title">
              Standards You Can See
            </h2>
            <AccentBar width="lg" align="center" className="homepage-section-accent" />
            <p className="section-subcopy homepage-section-intro mx-auto">
              Every badge represents a verified commitment — not a marketing claim. These are the standards
              every BeyondBabyCo product is held to.
            </p>
          </header>
        ) : (
          <header className="homepage-section-header mx-auto max-w-3xl text-center">
            <h2 id="quality-standards-heading" className="section-heading homepage-section-title">
              Our Quality Promise
            </h2>
            <AccentBar width="lg" align="center" className="homepage-section-accent" />
          </header>
        )}

        <div
          className={cn(
            "homepage-section-grid grid gap-5 sm:gap-6",
            compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
          )}
        >
          {items.map((standard, index) => (
            <div
              key={standard.id}
              className="scroll-reveal-item h-full"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="quality-promise-card flex h-full min-h-[11rem] flex-col items-center p-5 text-center sm:p-6">
                {standard.badge ? (
                  <span className="quality-icon-box">
                    <StaticSvgImage
                      src={standard.badge}
                      alt={standard.badgeAlt ?? standard.title}
                      width={48}
                      height={48}
                      className="h-10 w-10 object-contain"
                    />
                  </span>
                ) : standard.icon ? (
                  <span className="quality-icon-box">
                    <TrustIcon name={standard.icon} className="h-6 w-6 text-green-700" />
                  </span>
                ) : null}
                <h3 className="mt-4 font-heading text-sm font-bold uppercase tracking-[0.08em] text-green-800">
                  {standard.title}
                </h3>
                {!compact ? (
                  <p className="mt-2 font-body text-xs leading-[1.65] text-green-800">{standard.description}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
