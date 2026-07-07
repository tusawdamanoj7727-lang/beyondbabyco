/**
 * Homepage photography — Unsplash editorial assets from src/lib/images.ts.
 */

import { IMAGES } from "@/lib/images";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

export const HERO_DEFAULT_IMAGE = IMAGES.hero.mother_baby;
export const HERO_DEFAULT_BLUR = STATIC_IMAGE_BLUR;

export const categoryCard = (slug: string) => {
  const key = slug.toLowerCase();
  if (key.includes("wipes") || key.includes("wash") || key.includes("bath")) return IMAGES.categories.bath_body;
  if (key.includes("lotion") || key.includes("powder") || key.includes("skin")) return IMAGES.categories.skin_care;
  if (key.includes("oil") || key.includes("massage")) return IMAGES.categories.massage;
  if (key.includes("gift") || key.includes("newborn")) return IMAGES.categories.gift_sets;
  if (key.includes("shampoo") || key.includes("hair")) return IMAGES.categories.hair_care;
  return IMAGES.categories.wellness;
};

export const sciencePhoto = () => IMAGES.research.lab;
export const sciencePhotoBlur = () => STATIC_IMAGE_BLUR;

export const lifestylePhoto = (n: number) => {
  if (n === 15) return IMAGES.lifestyle.bath_routine;
  if (n === 3) return IMAGES.lifestyle.bath_routine;
  if (n === 8) return IMAGES.lifestyle.massage_time;
  if (n === 11) return IMAGES.lifestyle.play_time;
  return IMAGES.lifestyle.sleep_time;
};

export const lifestylePhotoBlur = () => STATIC_IMAGE_BLUR;

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
  if (n === 1) return IMAGES.lifestyle.sleep_time;
  if (n === 4) return IMAGES.lifestyle.feeding_time;
  if (n === 7) return IMAGES.lifestyle.outdoor;
  return IMAGES.lifestyle.bath_routine;
};

export const brandPromiseBlur = (_n?: number) => STATIC_IMAGE_BLUR;

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
  main: IMAGES.lifestyle.feeding_time,
  baby: IMAGES.lifestyle.sleep_time,
  mainBlur: STATIC_IMAGE_BLUR,
  babyBlur: STATIC_IMAGE_BLUR,
} as const;

export const beyondCarePhotos = {
  men: IMAGES.research.botanicals,
  women: IMAGES.lifestyle.massage_time,
  menBlur: STATIC_IMAGE_BLUR,
  womenBlur: STATIC_IMAGE_BLUR,
} as const;

export const categoryCardBlur = () => STATIC_IMAGE_BLUR;
