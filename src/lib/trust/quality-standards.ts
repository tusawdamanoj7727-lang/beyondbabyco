import { TRUST_BADGES } from "./images";

export type QualityStandard = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  badgeAlt?: string;
  icon?: string;
};

export const QUALITY_STANDARDS: QualityStandard[] = [
  {
    id: "dermatologically-tested",
    title: "Dermatologically Tested",
    description:
      "Every product is evaluated under dermatological supervision for irritation, sensitisation, and tolerance on sensitive skin.",
    badge: TRUST_BADGES.dermatologicallyTested,
    badgeAlt: "Dermatologically tested certification",
  },
  {
    id: "hypoallergenic",
    title: "Hypoallergenic",
    description:
      "Formulated to minimise allergen potential using carefully screened ingredients and fragrance-free options where applicable.",
    badge: TRUST_BADGES.hypoallergenic,
    badgeAlt: "Hypoallergenic",
  },
  {
    id: "paraben-free",
    title: "Paraben Free",
    description:
      "We do not use parabens in any BeyondBabyCo formulation — choosing alternative preservation systems validated for safety.",
    badge: TRUST_BADGES.parabenFree,
    badgeAlt: "Paraben free",
  },
  {
    id: "silicone-free",
    title: "Silicone Free",
    description:
      "Our formulations avoid silicones, allowing skin to breathe naturally without occlusive film-forming agents.",
    badge: TRUST_BADGES.siliconeFree,
    badgeAlt: "Silicone free",
  },
  {
    id: "mineral-oil-free",
    title: "Mineral Oil Free",
    description:
      "We use plant-derived emollients instead of mineral oil, supporting natural skin barrier function.",
    badge: TRUST_BADGES.mineralOilFree,
    badgeAlt: "Mineral oil free",
  },
  {
    id: "cruelty-free",
    title: "Cruelty Free",
    description:
      "BeyondBabyCo never tests on animals. Safety validation uses approved laboratory and dermatological methods.",
    badge: TRUST_BADGES.crueltyFree,
    badgeAlt: "Cruelty free",
  },
  {
    id: "made-in-india",
    title: "Made in India",
    description:
      "Proudly manufactured in India with global quality standards, supporting local expertise and supply chains.",
    badge: TRUST_BADGES.madeInIndia,
    badgeAlt: "Made in India",
  },
  {
    id: "gmp-manufacturing",
    title: "GMP Manufacturing",
    description:
      "Production at GMP-certified facilities with documented batch records, process controls, and release testing.",
    badge: TRUST_BADGES.gmpManufacturing,
    badgeAlt: "GMP manufacturing",
  },
  {
    id: "iso-quality",
    title: "ISO Quality",
    description:
      "Quality management systems aligned with ISO standards govern supplier selection, production, and customer feedback.",
    badge: TRUST_BADGES.isoQuality,
    badgeAlt: "ISO quality certification",
  },
  {
    id: "research-backed",
    title: "Research Backed",
    description:
      "Five years of ingredient research and formulation development underpin every product we create.",
    badge: TRUST_BADGES.clinicallyTested,
    badgeAlt: "Research backed and clinically tested",
  },
];
