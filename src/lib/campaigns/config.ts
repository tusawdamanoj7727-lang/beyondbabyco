import type { CampaignCenterConfig, MarketingCampaignType } from "./types";

const CONFIG_MARKER = "campaign_center";

export const DEFAULT_CAMPAIGN_CONFIG = (): CampaignCenterConfig => ({
  _type: "campaign_center",
  slug: "",
  marketingType: "product_launch",
  headline: "",
  subheading: "",
  description: "",
  cta: { label: "Shop Now", url: "/products" },
  targetUrl: "/products",
  startDate: null,
  endDate: null,
  priority: 50,
  theme: { primary: "#1a4d2e", background: "#faf7f2", accent: "#c45c3e" },
  assets: {},
  homepageSlot: null,
  couponId: null,
  landingSlug: null,
  landingSections: {
    showHero: true,
    showProducts: true,
    showBenefits: true,
    showTrust: true,
    showCta: true,
    showFaq: true,
    showNewsletter: true,
    productIds: [],
  },
  mediaAssets: [],
  communicationsTemplateId: null,
  aiCreatives: [],
});

export function slugifyCampaignName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function parseCampaignConfig(buttons: unknown): CampaignCenterConfig {
  if (!Array.isArray(buttons)) return DEFAULT_CAMPAIGN_CONFIG();

  const blob = buttons.find(
    (b) => b && typeof b === "object" && (b as Record<string, unknown>)._type === CONFIG_MARKER,
  ) as Record<string, unknown> | undefined;

  if (!blob) return DEFAULT_CAMPAIGN_CONFIG();

  const defaults = DEFAULT_CAMPAIGN_CONFIG();
  return {
    ...defaults,
    slug: String(blob.slug ?? defaults.slug),
    marketingType: (blob.marketingType as MarketingCampaignType) ?? defaults.marketingType,
    headline: String(blob.headline ?? defaults.headline),
    subheading: String(blob.subheading ?? defaults.subheading),
    description: String(blob.description ?? defaults.description),
    cta: {
      label: String((blob.cta as CampaignCenterConfig["cta"])?.label ?? defaults.cta.label),
      url: String((blob.cta as CampaignCenterConfig["cta"])?.url ?? defaults.cta.url),
    },
    targetUrl: String(blob.targetUrl ?? defaults.targetUrl),
    startDate: blob.startDate ? String(blob.startDate) : null,
    endDate: blob.endDate ? String(blob.endDate) : null,
    priority: Number(blob.priority ?? defaults.priority),
    theme: { ...defaults.theme, ...(blob.theme as CampaignCenterConfig["theme"]) },
    assets: { ...defaults.assets, ...(blob.assets as CampaignCenterConfig["assets"]) },
    homepageSlot: (blob.homepageSlot as CampaignCenterConfig["homepageSlot"]) ?? null,
    couponId: blob.couponId ? String(blob.couponId) : null,
    landingSlug: blob.landingSlug ? String(blob.landingSlug) : null,
    landingSections: {
      ...defaults.landingSections,
      ...(blob.landingSections as CampaignCenterConfig["landingSections"]),
    },
    mediaAssets: Array.isArray(blob.mediaAssets) ? (blob.mediaAssets as CampaignCenterConfig["mediaAssets"]) : [],
    communicationsTemplateId: blob.communicationsTemplateId ? String(blob.communicationsTemplateId) : null,
    aiCreatives: Array.isArray(blob.aiCreatives) ? (blob.aiCreatives as CampaignCenterConfig["aiCreatives"]) : [],
  };
}

export function serializeCampaignConfig(
  config: CampaignCenterConfig,
  existingButtons: unknown = [],
): Record<string, unknown>[] {
  const others = Array.isArray(existingButtons)
    ? existingButtons.filter(
        (b) => !(b && typeof b === "object" && (b as Record<string, unknown>)._type === CONFIG_MARKER),
      )
    : [];

  return [{ ...config, _type: CONFIG_MARKER }, ...others];
}
