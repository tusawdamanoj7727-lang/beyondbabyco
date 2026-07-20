"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/admin/Icon";
import type { IconName } from "@/components/admin/Icon";
import { Spinner } from "@/components/admin/LoadingState";
import { useSaver } from "./parts";
import {
  AnnouncementEditor,
  BrandPromiseEditor,
  FeaturedProductsEditor,
  FooterEditor,
  GeneralEditor,
  HeroEditor,
  LayoutEditor,
  LifestyleEditor,
  MascotsEditor,
  NewsletterEditor,
  PromotionsEditor,
  ResearchTimelineEditor,
  ScienceEditor,
  SeoEditor,
  TestimonialsEditor,
  TrustStatsEditor,
} from "./editors";
import { setHomepageStatus } from "@/lib/admin/homepage-actions";
import { CMS_NAV, type CmsNavKey, type PublishStatus } from "@/lib/admin/homepage-schema";
import type { HomepageAdminData } from "@/lib/admin/homepage";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Partial<Record<CmsNavKey, IconName>> = {
  general: "settings",
  layout: "panelLeft",
  hero: "homepage",
  announcement: "bell",
  promotions: "sparkles",
  featured_products: "products",
  trust_stats: "activity",
  brand_promise: "sparkles",
  science: "activity",
  lifestyle: "media",
  mascots: "sparkles",
  research_timeline: "activity",
  testimonials: "testimonials",
  newsletter: "newsletter",
  footer: "panelLeft",
  seo: "search",
};

export default function HomepageClient({ data }: { data: HomepageAdminData }) {
  const router = useRouter();
  const [active, setActive] = useState<CmsNavKey>("general");
  const [status, setStatus] = useState<PublishStatus>(data.status);
  const publisher = useSaver();

  const setPublish = (next: PublishStatus) => {
    setStatus(next);
    publisher.run(() => setHomepageStatus(next), () => router.refresh());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-4xl border border-cream-300 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-green-700/70">Status</span>
          <Badge variant={status === "published" ? "success" : "warning"} size="md">
            {status === "published" ? "Published" : "Draft"}
          </Badge>
          {publisher.pending && <Spinner size={16} />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-3xl px-4 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
          >
            <Icon name="external" size={16} />
            Preview
          </a>
          {status === "published" ? (
            <Button variant="secondary" size="sm" disabled={publisher.pending} onClick={() => setPublish("draft")}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" disabled={publisher.pending} onClick={() => setPublish("published")}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Homepage sections" className="lg:sticky lg:top-6 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {CMS_NAV.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key} className="shrink-0">
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActive(item.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                      isActive ? "bg-green-500 text-cream-50 shadow-clay" : "text-green-800 hover:bg-green-50",
                    )}
                  >
                    {SECTION_ICONS[item.key] ? (
                      <span className={isActive ? "text-cream-50" : "text-green-600"}>
                        <Icon name={SECTION_ICONS[item.key]!} size={16} />
                      </span>
                    ) : null}
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          <Editor active={active} data={data} />
        </div>
      </div>
    </div>
  );
}

function Editor({ active, data }: { active: CmsNavKey; data: HomepageAdminData }) {
  switch (active) {
    case "general":
      return <GeneralEditor data={data.settings.general} />;
    case "layout":
      return <LayoutEditor layout={data.sectionLayout} />;
    case "hero":
      return <HeroEditor section={data.sections.hero} slides={data.heroSlides} />;
    case "announcement":
      return <AnnouncementEditor section={data.sections.announcement} />;
    case "promotions":
      return <PromotionsEditor section={data.sections.promotions} />;
    case "featured_products":
      return <FeaturedProductsEditor section={data.sections.featured_products} products={data.options.products} />;
    case "trust_stats":
      return <TrustStatsEditor section={data.sections.trust_stats} />;
    case "brand_promise":
      return <BrandPromiseEditor section={data.sections.brand_promise} />;
    case "science":
      return <ScienceEditor section={data.sections.science} />;
    case "lifestyle":
      return <LifestyleEditor section={data.sections.lifestyle} />;
    case "mascots":
      return <MascotsEditor section={data.sections.mascots} />;
    case "research_timeline":
      return <ResearchTimelineEditor section={data.sections.research_timeline} />;
    case "testimonials":
      return <TestimonialsEditor section={data.sections.testimonials} testimonials={data.testimonials} />;
    case "newsletter":
      return <NewsletterEditor section={data.sections.newsletter} />;
    case "footer":
      return <FooterEditor data={data.settings.footer} />;
    case "seo":
      return <SeoEditor data={data.settings.seo} />;
    default:
      return null;
  }
}
