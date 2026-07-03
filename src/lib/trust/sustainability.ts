import { TRUST_IMAGES } from "./images";

export type SustainabilityItem = {
  title: string;
  description: string;
  icon: string;
  image?: string;
  imageAlt?: string;
};

export const SUSTAINABILITY_ITEMS: SustainabilityItem[] = [
  {
    title: "Eco-Friendly Packaging",
    description:
      "We prioritise recyclable and reduced-material packaging wherever possible, minimising plastic use without compromising product safety and hygiene.",
    icon: "recycle",
    image: TRUST_IMAGES.sustainability,
    imageAlt: "Eco-friendly packaging for baby care products",
  },
  {
    title: "Responsible Sourcing",
    description:
      "Ingredients are sourced from suppliers who meet our quality and ethical standards. We favour plant-derived and sustainably harvested materials.",
    icon: "leaf",
  },
  {
    title: "Minimal Waste",
    description:
      "Our manufacturing partners follow waste reduction protocols, including batch optimisation and responsible disposal of production byproducts.",
    icon: "minimize-2",
  },
  {
    title: "Recyclable Materials",
    description:
      "Primary packaging materials are selected for recyclability. We include disposal guidance on product labels to support responsible recycling.",
    icon: "package-check",
  },
];

export const SUSTAINABILITY_GOALS = [
  "Achieve 100% recyclable primary packaging across all product lines by 2028",
  "Reduce packaging weight by 20% through design optimisation",
  "Partner with certified sustainable ingredient suppliers for all botanical extracts",
  "Publish an annual sustainability progress report for transparency",
];

export const SUSTAINABILITY_INTRO =
  "BeyondBabyCo is committed to reducing our environmental footprint while maintaining the safety and quality standards families depend on. Sustainability is a journey — and we are building it into every decision we make.";
