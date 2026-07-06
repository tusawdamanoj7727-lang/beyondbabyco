import Image from "next/image";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import { RESEARCH_TIMELINE as RESEARCH_SECTION } from "@/lib/brand/copy";
import { RESEARCH_TIMELINE } from "../../lib/data";
import type { ResearchTimelineConfig, TimelineEntry } from "@/lib/admin/homepage-schema";
import { resolveVisualUrl, TIMELINE_VISUALS } from "@/lib/brand/generated-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";

export default function ResearchTimeline({ config }: { config?: ResearchTimelineConfig }) {
  const heading = config?.heading?.trim() || RESEARCH_SECTION.heading;
  const entries: TimelineEntry[] =
    config?.entries && config.entries.length > 0 ? config.entries : RESEARCH_TIMELINE;

  return (
    <HomeSection id="research" tone="white" className="overflow-visible">
      <HomepageMascotGuide
        mascot="eli-elephant"
        pose="reading"
        size={150}
        placementClassName="-right-4 top-12 xl:-right-10"
      />
      <HomeSectionHeader
        eyebrow={RESEARCH_SECTION.eyebrow}
        heading={heading}
        intro={RESEARCH_SECTION.intro}
      />

      <div className="homepage-section-grid relative pt-4">
        <span
          aria-hidden="true"
          className="homepage-timeline-line absolute bottom-0 left-6 top-0 -translate-x-1/2 md:left-1/2"
        />

        <ol className="flex flex-col gap-12 md:gap-16 lg:gap-20">
          {entries.map((item, index) => {
            const isLeft = index % 2 === 0;
            const fallbackRef = TIMELINE_VISUALS[index % TIMELINE_VISUALS.length];
            const visual = resolveVisualUrl(item.imageUrl, fallbackRef);

            return (
              <li key={`${item.year}-${item.title}`} className="relative">
                <ScrollReveal delayMs={index * 70}>
                <span
                  aria-hidden="true"
                  className="homepage-timeline-node absolute left-6 top-8 z-10 flex -translate-x-1/2 items-center justify-center border border-green-200/70 bg-cream-50 font-heading font-bold text-green-700 md:left-1/2 md:top-1/2 md:-translate-y-1/2"
                >
                  {item.year}
                </span>

                <div className="pl-[3.25rem] md:grid md:grid-cols-2 md:gap-14 md:pl-0 lg:gap-16">
                  <div className={isLeft ? "md:col-start-1" : "md:col-start-2 md:row-start-1"}>
                    <Card
                      as="article"
                      variant="glass"
                      radius="3xl"
                      padding="lg"
                      hover
                      className="homepage-card homepage-timeline-card"
                    >
                      <div className="premium-image-frame homepage-timeline-media relative mb-5 w-full overflow-hidden">
                        <Image
                          src={visual.url}
                          alt=""
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 400px"
                          placeholder="blur"
                          blurDataURL={resolveImageBlur(visual.blur)}
                          className="object-cover object-[center_22%]"
                        />
                      </div>
                      <span className="hidden font-heading text-2xl font-bold leading-none text-green-800 md:block md:text-[1.75rem]">
                        {item.year}
                      </span>
                      <h3 className="mt-3 font-heading text-[clamp(1.2rem,2vw,1.5rem)] font-semibold leading-tight text-green-800">
                        {item.title}
                      </h3>
                      <p className="prose-measure mt-3 font-body text-base leading-[1.75] text-green-700/88">
                        {item.description}
                      </p>
                    </Card>
                  </div>
                </div>
                </ScrollReveal>
              </li>
            );
          })}
        </ol>
      </div>
    </HomeSection>
  );
}
