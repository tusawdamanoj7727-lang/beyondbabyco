import HomeSection from "@/components/homepage/HomeSection";
import { TRUST_STATS } from "@/lib/data";

const CARD_DELAYS = [0, 80, 160, 240];

export default function StatsBar() {
  return (
    <HomeSection tone="cream" compact reveal className="homepage-stats-band">
      <div className="homepage-section-grid grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
        {TRUST_STATS.map((stat, index) => (
          <div
            key={stat.label}
            className="scroll-reveal-item homepage-stat-item w-full"
            style={{ animationDelay: `${CARD_DELAYS[index] ?? 0}ms` }}
          >
            <span className="homepage-stat-value">{stat.value}</span>
            <span className="homepage-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
