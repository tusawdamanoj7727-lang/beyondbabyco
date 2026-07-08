/**
 * Homepage photography — self-hosted generated editorial assets.
 */

import { EDITORIAL } from "@/lib/brand/generated-assets";
import { IMAGES } from "@/lib/images";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

export const HERO_DEFAULT_IMAGE = EDITORIAL.hero.url;
export const HERO_DEFAULT_BLUR = EDITORIAL.hero.blur;

export const categoryCard = (slug: string) => {
  const key = slug.toLowerCase();
  if (key.includes("wipes") || key.includes("wash") || key.includes("bath")) return IMAGES.categories.bath_body;
  if (key.includes("lotion") || key.includes("powder") || key.includes("skin")) return IMAGES.categories.skin_care;
  if (key.includes("oil") || key.includes("massage")) return IMAGES.categories.massage;
  if (key.includes("gift") || key.includes("newborn")) return IMAGES.categories.gift_sets;
  if (key.includes("shampoo") || key.includes("hair")) return IMAGES.categories.hair_care;
  return IMAGES.categories.wellness;
};

export const sciencePhoto = () => EDITORIAL.science.url;
export const sciencePhotoBlur = () => EDITORIAL.science.blur;

export const lifestylePhoto = (n: number) => {
  if (n === 15 || n === 3) return EDITORIAL.lifestyleCards[0]?.url ?? IMAGES.lifestyle.bath_routine;
  if (n === 8) return EDITORIAL.lifestyleCards[1]?.url ?? IMAGES.lifestyle.massage_time;
  if (n === 11) return EDITORIAL.lifestyleCards[2]?.url ?? IMAGES.lifestyle.play_time;
  return EDITORIAL.lifestyleHero.url;
};

export const lifestylePhotoBlur = () => EDITORIAL.lifestyleHero.blur;

export const researchPhoto = (n: number) => {
  const images = [
    IMAGES.research.lab,
    IMAGES.research.ingredients,
    IMAGES.research.testing,
    IMAGES.research.certificate,
    IMAGES.research.botanicals,
  ];
  return images[(n - 1) % images.length] ?? IMAGES.research.lab;
};

export const brandPromisePhoto = (n: number) => {
  if (n === 1) return EDITORIAL.brandPromise[0]?.url ?? IMAGES.lifestyle.sleep_time;
  if (n === 4) return EDITORIAL.brandPromise[1]?.url ?? IMAGES.lifestyle.feeding_time;
  if (n === 7) return EDITORIAL.brandPromise[2]?.url ?? IMAGES.lifestyle.outdoor;
  return IMAGES.lifestyle.bath_routine;
};

export const brandPromiseBlur = (n: number) => {
  if (n === 1) return EDITORIAL.brandPromise[0]?.blur ?? STATIC_IMAGE_BLUR;
  if (n === 4) return EDITORIAL.brandPromise[1]?.blur ?? STATIC_IMAGE_BLUR;
  if (n === 7) return EDITORIAL.brandPromise[2]?.blur ?? STATIC_IMAGE_BLUR;
  return STATIC_IMAGE_BLUR;
};

export const testimonialPortraitUrl = (n: number) => {
  const portraits = [
    IMAGES.lifestyle.massage_time,
    IMAGES.lifestyle.play_time,
    IMAGES.lifestyle.feeding_time,
    IMAGES.lifestyle.sleep_time,
    IMAGES.research.testing,
    IMAGES.lifestyle.outdoor,
  ];
  return portraits[(n - 1) % portraits.length] ?? IMAGES.lifestyle.bath_routine;
};

export const testimonialPortraitBlur = (_n?: number) => STATIC_IMAGE_BLUR;

export const newsletterPhoto = {
  main: EDITORIAL.newsletter.url,
  baby: EDITORIAL.newsletterAlt.url,
  mainBlur: EDITORIAL.newsletter.blur,
  babyBlur: EDITORIAL.newsletterAlt.blur,
} as const;

export const categoryCardBlur = () => STATIC_IMAGE_BLUR;
