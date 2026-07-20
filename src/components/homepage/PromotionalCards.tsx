import Image from "next/image";
import Link from "next/link";

import HomeSection from "@/components/homepage/HomeSection";
import type { PromotionsConfig } from "@/lib/admin/homepage-schema";
import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";
import { fixedImageSizes, IMAGE_QUALITY } from "@/lib/media/image-delivery";

/**
 * Homepage promotional cards — CMS evergreen + optional campaign overlay card.
 */
export default function PromotionalCards({
  config,
  campaign,
}: {
  config: PromotionsConfig;
  campaign?: StorefrontCampaignSlot | null;
}) {
  const cards = [...(config.cards ?? [])];
  // Only prepend a campaign card when a real active campaign exists (not demos).
  if (campaign?.headline && cards.length < 6) {
    cards.unshift({
      title: campaign.headline || "Limited offer",
      description: campaign.subheading || "",
      href: campaign.ctaUrl || campaign.targetUrl || "/products",
      emoji: "",
      imageUrl: campaign.bannerUrl || campaign.heroUrl || undefined,
    });
  }

  if (!cards.length) return null;

  return (
    <HomeSection tone="cream" reveal={false} className="overflow-visible">
      {config.heading ? (
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-green-950 sm:text-3xl">
          {config.heading}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {cards.slice(0, 8).map((card) => (
          <Link
            key={`${card.title}-${card.href}`}
            href={card.href || "/products"}
            className="group relative flex min-h-[9.5rem] flex-col justify-end overflow-hidden rounded-3xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-400 sm:min-h-[11rem] sm:p-5"
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt=""
                fill
                loading="lazy"
                sizes={fixedImageSizes(280)}
                quality={IMAGE_QUALITY.editorial}
                className="object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
              />
            ) : null}
            <div className={card.imageUrl ? "relative z-10 rounded-2xl bg-cream-50/90 p-3 backdrop-blur-sm" : ""}>
              {card.emoji ? <span className="mb-1 block text-xl" aria-hidden="true">{card.emoji}</span> : null}
              <span className="block text-sm font-semibold text-green-950 sm:text-base">{card.title}</span>
              {card.description ? (
                <span className="mt-0.5 block text-xs text-green-800/75 sm:text-sm">{card.description}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </HomeSection>
  );
}
