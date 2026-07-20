import "server-only";

import { cache } from "react";

import {
  getCampaignCenterOverview,
  getStorefrontCampaignSlots,
  type StorefrontCampaignSlot,
} from "@/lib/admin/campaign-center";
import { resolveRotatingSlotCampaigns } from "@/lib/campaigns/helpers";
import type { HomepageCampaignSlot } from "@/lib/campaigns/types";
import { getStorefrontHomepage, type StorefrontHomepage } from "@/lib/homepage/storefront";

export type MarketingSurfaces = {
  announcement: StorefrontHomepage["announcement"];
  slots: Partial<Record<HomepageCampaignSlot, StorefrontCampaignSlot>>;
  /** Active campaign that should override evergreen announcement CMS. */
  announcementCampaign: StorefrontCampaignSlot | null;
  heroCampaign: StorefrontCampaignSlot | null;
  promoCampaign: StorefrontCampaignSlot | null;
  bannerCampaign: StorefrontCampaignSlot | null;
  popupCampaign: StorefrontCampaignSlot | null;
  newsletterCampaign: StorefrontCampaignSlot | null;
};

function isWithinSchedule(startsAt?: string, endsAt?: string, now = Date.now()): boolean {
  if (startsAt) {
    const start = Date.parse(startsAt);
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

/** Resolve CMS announcement + active campaign slot overlays for storefront. */
export const getMarketingSurfaces = cache(async (): Promise<MarketingSurfaces> => {
  const [home, slots, overview] = await Promise.all([
    getStorefrontHomepage(),
    getStorefrontCampaignSlots(),
    getCampaignCenterOverview({ includeDemos: false }),
  ]);

  const announcementCampaign = slots.announcement_bar ?? null;
  const cms = home.announcement;
  const cmsScheduled = isWithinSchedule(cms.startsAt, cms.endsAt);

  let announcement = cms;
  if (!cmsScheduled) {
    announcement = { ...cms, enabled: false };
  }

  const liveCampaigns = overview.campaigns.filter((c) => !c.id.startsWith("demo-"));
  const rotating = resolveRotatingSlotCampaigns(
    liveCampaigns,
    "announcement_bar",
    Math.max(1, cms.maxVisible ?? 5),
  );

  if (rotating.length > 0) {
    const lines = rotating
      .flatMap((c) => [c.config.headline, c.config.subheading])
      .map((s) => s?.trim())
      .filter(Boolean) as string[];
    const primary = rotating[0]!;
    announcement = {
      ...announcement,
      enabled: true,
      items: lines.length ? lines : announcement.items,
      background: primary.config.theme.background || announcement.background,
      textColor: primary.config.theme.primary || announcement.textColor,
      link: primary.config.targetUrl || announcement.link,
      ctaLabel: primary.config.cta.label || announcement.ctaLabel,
      ctaUrl: primary.config.cta.url || announcement.ctaUrl,
      startsAt: undefined,
      endsAt: undefined,
    };
  } else if (announcementCampaign) {
    const lines = [announcementCampaign.headline, announcementCampaign.subheading]
      .map((s) => s?.trim())
      .filter(Boolean) as string[];
    announcement = {
      ...announcement,
      enabled: true,
      items: lines.length ? lines : announcement.items,
      background: announcementCampaign.theme.background || announcement.background,
      textColor: announcementCampaign.theme.primary || announcement.textColor,
      link: announcementCampaign.targetUrl || announcement.link,
      ctaLabel: announcementCampaign.ctaLabel || announcement.ctaLabel,
      ctaUrl: announcementCampaign.ctaUrl || announcement.ctaUrl,
      startsAt: undefined,
      endsAt: undefined,
    };
  }

  return {
    announcement,
    slots,
    announcementCampaign,
    heroCampaign: slots.homepage_hero ?? null,
    promoCampaign: slots.campaign_cards ?? null,
    bannerCampaign: slots.homepage_banner ?? null,
    popupCampaign: slots.popup_banner ?? null,
    newsletterCampaign: slots.newsletter_banner ?? null,
  };
});
