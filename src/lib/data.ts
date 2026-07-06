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
import { categoryCardBlur, categoryCardUrl, resolveProductVisual } from "@/lib/brand/generated-assets";
import {
  brandPromiseBlur,
  brandPromisePhoto,
  HERO_DEFAULT_BLUR,
  HERO_DEFAULT_IMAGE,
  testimonialPortraitBlur,
  testimonialPortraitUrl,
  timelineVisual,
} from "@/lib/homepage/visual-assets";

export { HERO_DEFAULT_IMAGE, HERO_DEFAULT_BLUR };

export const TICKER_ITEMS: string[] = [...TICKER_COPY];
export const TRENDING_SEARCHES: string[] = [...TRENDING_COPY];
export { TRUST_STATS };

export const TESTIMONIALS = TESTIMONIAL_COPY.items.map((t, i) => ({
  ...t,
  avatarUrl: testimonialPortraitUrl(i + 1),
  avatarBlur: testimonialPortraitBlur(i + 1),
}));

export const RESEARCH_TIMELINE = RESEARCH_COPY.entries.map((entry, i) => {
  const visual = timelineVisual(i);
  return {
    ...entry,
    imageUrl: visual.url,
    imageBlur: visual.blur,
  };
});

export const FEATURED_PRODUCTS = FEATURED_PRODUCT_CARDS.map((p) => {
  const categoryKey = p.category.toLowerCase();
  const slugHint = categoryKey.includes("wipes")
    ? "baby-wipes"
    : categoryKey.includes("wash")
      ? "baby-wash"
      : categoryKey.includes("lotion")
        ? "baby-lotion"
        : categoryKey.includes("oil")
          ? "baby-oil"
          : categoryKey.includes("powder")
            ? "baby-powder"
            : categoryKey.includes("gift")
              ? "gift-box"
              : categoryKey.includes("newborn")
                ? "newborn-kit"
                : "baby-wash";

  const visual = resolveProductVisual({ slug: slugHint, angle: "front" });
  return {
    ...p,
    imageUrl: visual.imageUrl,
    imageBlur: visual.imageBlurDataUrl,
  };
});

const CATEGORY_IMAGES: Record<string, { icon: string; blur: string; color: string }> = {
  "Baby Wipes": { icon: categoryCardUrl("baby-wipes"), blur: categoryCardBlur("baby-wipes"), color: "green" },
  "Baby Wash": { icon: categoryCardUrl("baby-wash"), blur: categoryCardBlur("baby-wash"), color: "terra" },
  "Baby Lotion": { icon: categoryCardUrl("baby-lotion"), blur: categoryCardBlur("baby-lotion"), color: "cream" },
  "Baby Oil": { icon: categoryCardUrl("baby-oil"), blur: categoryCardBlur("baby-oil"), color: "green" },
  "Baby Powder": { icon: categoryCardUrl("baby-powder"), blur: categoryCardBlur("baby-powder"), color: "terra" },
  "Gift Sets": { icon: categoryCardUrl("gift-sets"), blur: categoryCardBlur("gift-sets"), color: "cream" },
  "Newborn Essentials": { icon: categoryCardUrl("newborn"), blur: categoryCardBlur("newborn"), color: "green" },
  "Bath Time": { icon: categoryCardUrl("baby-wash"), blur: categoryCardBlur("baby-wash"), color: "terra" },
};

export const CATEGORY_ITEMS = CATEGORY_COPY.map((cat) => {
  const meta = CATEGORY_IMAGES[cat.title] ?? {
    icon: categoryCardUrl(cat.title),
    blur: categoryCardUrl(cat.title),
    color: "green",
  };
  return {
    title: cat.title,
    count: cat.count,
    icon: meta.icon,
    imageUrl: meta.icon,
    imageBlur: meta.blur,
    color: meta.color,
  };
});

export const BRAND_PROMISE_DEFAULTS = BRAND_PROMISE.cards.map((card, index) => ({
  ...card,
  imageUrl: brandPromisePhoto(index === 0 ? 1 : index === 1 ? 4 : 7),
  imageBlur: brandPromiseBlur(index === 0 ? 1 : index === 1 ? 4 : 7),
}));

export { MASCOT_PROFILES } from "@/lib/mascots/profiles";
export type { MascotProfile, MascotColor } from "@/lib/mascots/profiles";
