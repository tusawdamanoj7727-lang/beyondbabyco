/**
 * Homepage photography — Phase 11.4 editorial assets from /images/generated/.
 */

import {
  categoryCardBlur,
  categoryCardUrl,
  EDITORIAL,
  genVisual,
  testimonialPortrait,
  timelineVisual,
} from "@/lib/brand/generated-assets";

export const HERO_DEFAULT_IMAGE = EDITORIAL.hero.url;
export const HERO_DEFAULT_BLUR = EDITORIAL.hero.blur;

export const categoryCard = (slug: string) => categoryCardUrl(slug);

export const sciencePhoto = () => EDITORIAL.science.url;
export const sciencePhotoBlur = () => EDITORIAL.science.blur;

export const lifestylePhoto = (n: number) => {
  if (n === 15) return EDITORIAL.lifestyleHero.url;
  const cardIndex = n === 3 ? 0 : n === 8 ? 1 : n === 11 ? 2 : 0;
  return EDITORIAL.lifestyleCards[cardIndex]?.url ?? EDITORIAL.lifestyleHero.url;
};

export const lifestylePhotoBlur = (n: number) => {
  if (n === 15) return EDITORIAL.lifestyleHero.blur;
  const cardIndex = n === 3 ? 0 : n === 8 ? 1 : n === 11 ? 2 : 0;
  return EDITORIAL.lifestyleCards[cardIndex]?.blur ?? EDITORIAL.lifestyleHero.blur;
};

export const researchPhoto = (n: number) => timelineVisual(n - 1).url;

export const brandPromisePhoto = (n: number) => {
  const idx = n === 1 ? 0 : n === 4 ? 1 : n === 7 ? 2 : 0;
  return EDITORIAL.brandPromise[idx]?.url ?? EDITORIAL.brandPromise[0].url;
};

export const brandPromiseBlur = (n: number) => {
  const idx = n === 1 ? 0 : n === 4 ? 1 : n === 7 ? 2 : 0;
  return EDITORIAL.brandPromise[idx]?.blur ?? EDITORIAL.brandPromise[0].blur;
};

export const testimonialPortraitUrl = (n: number) => testimonialPortrait(n - 1).url;
export const testimonialPortraitBlur = (n: number) => testimonialPortrait(n - 1).blur;

export const newsletterPhoto = {
  main: EDITORIAL.newsletter.url,
  baby: EDITORIAL.newsletterAlt.url,
  mainBlur: EDITORIAL.newsletter.blur,
  babyBlur: EDITORIAL.newsletterAlt.blur,
} as const;

export const beyondCarePhotos = {
  men: EDITORIAL.beyondCareMen.url,
  women: EDITORIAL.beyondCareWomen.url,
  menBlur: EDITORIAL.beyondCareMen.blur,
  womenBlur: EDITORIAL.beyondCareWomen.blur,
} as const;

export { categoryCardBlur, genVisual, timelineVisual };
