import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CampaignPreviewPanel from "@/components/campaigns/CampaignPreviewPanel";
import TrustWidgets from "@/components/trust/TrustWidgets";
import NewsletterCTA from "@/components/sections/NewsletterCTA";
import JsonLd from "@/components/seo/JsonLd";
import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DEFAULTS } from "@/lib/admin/homepage-schema";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const overview = await getCampaignCenterOverview();
  const campaign = overview.campaigns.find((c) => c.config.slug === slug || c.config.landingSlug === slug);
  if (!campaign) return { title: "Campaign — BeyondBabyCo" };
  return buildPageMetadata({
    title: campaign.config.headline || campaign.name,
    description: campaign.config.description || campaign.config.subheading || undefined,
    path: `/campaigns/${slug}`,
  });
}

export default async function CampaignLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const overview = await getCampaignCenterOverview();
  const campaign = overview.campaigns.find((c) => c.config.slug === slug || c.config.landingSlug === slug);
  if (!campaign) notFound();

  const s = campaign.config.landingSections;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: campaign.name },
        ])}
      />
      <div className="container py-10 md:py-14">
        <nav className="text-sm text-green-700">
          <Link href="/" className="hover:text-terra-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-green-900">{campaign.name}</span>
        </nav>

        {s.showHero ? (
          <div className="mt-8">
            <CampaignPreviewPanel config={campaign.config} name={campaign.name} viewport="desktop" />
          </div>
        ) : null}

        {s.showTrust ? (
          <div className="mt-12">
            <TrustWidgets />
          </div>
        ) : null}

        {s.showCta ? (
          <div className="mt-12 text-center">
            <Link
              href={campaign.config.targetUrl}
              className="inline-flex min-h-[48px] items-center rounded-full bg-green-900 px-8 py-3 font-semibold text-white hover:bg-green-800"
            >
              {campaign.config.cta.label}
            </Link>
          </div>
        ) : null}

        {s.showFaq && campaign.config.description ? (
          <section className="mt-12 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-green-900">About this campaign</h2>
            <p className="mt-4 text-body leading-relaxed text-green-800">{campaign.config.description}</p>
          </section>
        ) : null}

        {s.showNewsletter ? (
          <div className="mt-16">
            <NewsletterCTA config={DEFAULTS.newsletter} />
          </div>
        ) : null}
      </div>
    </>
  );
}
