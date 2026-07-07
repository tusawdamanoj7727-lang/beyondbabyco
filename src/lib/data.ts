import {
  BRAND_PROMISE,
  CATEGORY_ITEMS as CATEGORY_COPY,
  FEATURED_PRODUCT_CARDS,
  RESEARCH_TIMELINE as RESEARCH_COPY,
  TESTIMONIALS as TESTIMONIAL_COPY,
  TICKER_ITEMS as TICKER_COPY,
  TRENDING_SEARCHES as TRENDING_COPY,
  TRUST_STATS,
} from "@/lib/brand/copy";
import { PRODUCT_GST_BY_NAME } from "@/lib/catalog/gst-rates";
import { CATEGORY_IMAGES_BY_TITLE, IMAGES, PRODUCT_IMAGES_BY_SLUG } from "@/lib/images";
import {
  brandPromiseBlur,
  brandPromisePhoto,
  HERO_DEFAULT_BLUR,
  HERO_DEFAULT_IMAGE,
  testimonialPortraitBlur,
  testimonialPortraitUrl,
} from "@/lib/homepage/visual-assets";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

export { HERO_DEFAULT_IMAGE, HERO_DEFAULT_BLUR };

/** GST % by product family name (baby care 12%, oils/cosmetics 18%). */
export const PRODUCT_GST_RATES = PRODUCT_GST_BY_NAME;

export const TICKER_ITEMS: string[] = [...TICKER_COPY];
export const TRENDING_SEARCHES: string[] = [...TRENDING_COPY];
export { TRUST_STATS };

export const TESTIMONIALS = TESTIMONIAL_COPY.items.map((t, i) => ({
  ...t,
  avatarUrl: testimonialPortraitUrl(i + 1),
  avatarBlur: testimonialPortraitBlur(i + 1),
}));

const RESEARCH_IMAGES = [
  IMAGES.research.lab,
  IMAGES.research.ingredients,
  IMAGES.research.testing,
  IMAGES.research.certificate,
  IMAGES.research.botanicals,
  IMAGES.research.lab,
] as const;

export const RESEARCH_TIMELINE = RESEARCH_COPY.entries.map((entry, i) => ({
  ...entry,
  imageUrl: RESEARCH_IMAGES[i % RESEARCH_IMAGES.length],
  imageBlur: STATIC_IMAGE_BLUR,
}));

function featuredProductImage(card: (typeof FEATURED_PRODUCT_CARDS)[number]): string {
  if ("slug" in card && card.slug && PRODUCT_IMAGES_BY_SLUG[card.slug]) {
    return PRODUCT_IMAGES_BY_SLUG[card.slug]!;
  }

  const categoryKey = card.category.toLowerCase();
  if (categoryKey.includes("wipes")) return IMAGES.products.baby_wipes;
  if (categoryKey.includes("wash")) return IMAGES.products.baby_wash;
  if (categoryKey.includes("lotion")) return IMAGES.products.baby_lotion;
  if (categoryKey.includes("oil") || categoryKey.includes("massage")) return IMAGES.products.massage_oil;
  if (categoryKey.includes("powder")) return IMAGES.products.baby_cream;
  if (categoryKey.includes("gift")) return IMAGES.products.gift_set;
  if (categoryKey.includes("newborn")) return IMAGES.products.gift_set;
  return IMAGES.products.placeholder;
}

export const FEATURED_PRODUCTS = FEATURED_PRODUCT_CARDS.map((p) => ({
  ...p,
  gstRate: p.gstRate,
  imageUrl: featuredProductImage(p),
  imageBlur: STATIC_IMAGE_BLUR,
}));

export const CATEGORY_ITEMS = CATEGORY_COPY.map((cat) => {
  const imageUrl = CATEGORY_IMAGES_BY_TITLE[cat.title] ?? IMAGES.categories.skin_care;
  return {
    title: cat.title,
    count: cat.count,
    icon: imageUrl,
    imageUrl,
    imageBlur: STATIC_IMAGE_BLUR,
    color: "green",
  };
});

export const BRAND_PROMISE_DEFAULTS = BRAND_PROMISE.cards.map((card, index) => ({
  ...card,
  imageUrl: brandPromisePhoto(index === 0 ? 1 : index === 1 ? 4 : 7),
  imageBlur: brandPromiseBlur(index === 0 ? 1 : index === 1 ? 4 : 7),
}));

export { MASCOT_PROFILES } from "@/lib/mascots/profiles";
export type { MascotProfile, MascotColor } from "@/lib/mascots/profiles";
