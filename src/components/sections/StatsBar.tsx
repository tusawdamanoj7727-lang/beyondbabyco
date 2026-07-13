import HomeSection from "@/components/homepage/HomeSection";
import { TRUST_STATS } from "@/lib/data";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";

const CARD_DELAYS = [0, 80, 160, 240, 320];

export default function StatsBar() {
  return (
    <HomeSection tone="cream" compact reveal className="homepage-stats-band overflow-visible">
      <HomepageMascotGuide
        mascot="penny-penguin"
        pose="welcome"
        size={120}
        placementClassName="-left-2 bottom-0 xl:-left-6"
      />
      <div className="homepage-section-grid grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
        {TRUST_STATS.map((stat, index) => (
          <div
            key={`${stat.value}-${stat.label}`}
            className="scroll-reveal-item text-center"
            style={{ animationDelay: `${CARD_DELAYS[index] ?? 0}ms` }}
          >
            <div className="px-6 py-4 text-center">
              <div className="text-3xl font-black text-brand-forest md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-gray-500 md:text-base">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
