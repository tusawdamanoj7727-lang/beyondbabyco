"use client";

import type { CampaignCenterConfig } from "@/lib/campaigns/types";

export default function LandingPagePreview({ config, name }: { config: CampaignCenterConfig; name: string }) {
  const s = config.landingSections;

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-cream-50/30" aria-label="Landing page preview">
      <p className="border-b border-cream-200 bg-white px-4 py-2 text-xs font-semibold text-green-700/60">
        Landing preview · /campaigns/{config.landingSlug || config.slug || "preview"}
      </p>
      <div className="space-y-2 p-4">
        {s.showHero ? <PreviewBlock title="Hero" content={config.headline || name} accent /> : null}
        {s.showProducts ? <PreviewBlock title="Featured products" content="Product grid from catalog" /> : null}
        {s.showBenefits ? <PreviewBlock title="Benefits" content="Key product benefits" /> : null}
        {s.showTrust ? <PreviewBlock title="Trust" content="Trust widgets & certifications" /> : null}
        {s.showCta ? <PreviewBlock title="CTA" content={config.cta.label} accent /> : null}
        {s.showFaq ? <PreviewBlock title="FAQ" content="Campaign FAQs" /> : null}
        {s.showNewsletter ? <PreviewBlock title="Newsletter" content="Subscribe CTA" /> : null}
      </div>
    </div>
  );
}

function PreviewBlock({ title, content, accent }: { title: string; content: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ${accent ? "bg-green-900 text-white" : "bg-white text-green-800"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      <p className="mt-1 text-sm font-medium">{content}</p>
    </div>
  );
}
