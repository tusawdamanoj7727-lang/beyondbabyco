import { CONTENT_EDITORIAL } from "@/lib/brand/generated-assets";
import { TRUST_IMAGES } from "./images";

export type IngredientProfile = {
  id: string;
  name: string;
  origin: string;
  purpose: string;
  benefits: string[];
  safetyProfile: string;
  skinCompatibility: string;
  suitableAge: string;
  researchSummary: string;
  relatedProducts: { name: string; href: string }[];
  image: string;
  imageAlt: string;
};

export const CORE_INGREDIENTS: IngredientProfile[] = [
  {
    id: "purified-water",
    name: "Purified Water",
    origin: "Multi-stage purified water sourced and processed in India to pharmaceutical-grade clarity.",
    purpose: "Primary base for our 99% Pure Water Baby Wipes — providing gentle cleansing without harsh solvents.",
    benefits: [
      "Ultra-gentle on newborn skin",
      "Free from impurities and contaminants",
      "Supports minimal-ingredient formulations",
    ],
    safetyProfile:
      "Purified water is universally recognised as safe for topical use on all ages, including newborns. Our purification process removes minerals, microbes, and particulates.",
    skinCompatibility: "Suitable for all skin types, including sensitive and eczema-prone skin.",
    suitableAge: "Newborn and above",
    researchSummary:
      "Water-based formulations are recommended by dermatologists for daily cleansing of infant skin due to their low irritation potential and compatibility with the skin barrier.",
    relatedProducts: [
      { name: "99% Pure Water Baby Wipes", href: "/products" },
    ],
    image: TRUST_IMAGES.ingredient,
    imageAlt: "Purified water for gentle baby cleansing",
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    origin: "Aloe barbadensis leaf extract, sustainably sourced and processed to preserve active compounds.",
    purpose: "Provides soothing and moisturising properties in wipes and skin care formulations.",
    benefits: [
      "Soothes irritated skin",
      "Supports natural hydration",
      "Calming effect on sensitive areas",
    ],
    safetyProfile:
      "Aloe vera is widely used in baby care with a long history of safe topical application. Our extract is decolourised and purified to minimise allergen potential.",
    skinCompatibility: "Well tolerated on delicate and sensitive baby skin.",
    suitableAge: "Newborn and above",
    researchSummary:
      "Studies indicate aloe vera contains polysaccharides and glycoproteins that support skin hydration and may help reduce mild irritation from environmental exposure.",
    relatedProducts: [
      { name: "99% Pure Water Baby Wipes", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.ingredientAloe.url,
    imageAlt: "Aloe vera extract for baby skin care",
  },
  {
    id: "vitamin-e",
    name: "Vitamin E (Tocopherol)",
    origin: "Plant-derived tocopherol, a natural antioxidant used in cosmetic and baby care formulations worldwide.",
    purpose: "Protects skin from oxidative stress and supports barrier health in daily-use products.",
    benefits: [
      "Antioxidant protection",
      "Supports skin barrier function",
      "Helps maintain skin softness",
    ],
    safetyProfile:
      "Tocopherol is GRAS (Generally Recognised As Safe) for cosmetic use and is commonly included in infant products at low concentrations.",
    skinCompatibility: "Compatible with all skin types; used at concentrations suitable for baby skin.",
    suitableAge: "Newborn and above",
    researchSummary:
      "Vitamin E is an established antioxidant in dermatology, known for its role in protecting lipids in the skin barrier from free radical damage.",
    relatedProducts: [
      { name: "99% Pure Water Baby Wipes", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.ingredients.url,
    imageAlt: "Vitamin E antioxidant for baby skin",
  },
  {
    id: "chamomile",
    name: "Chamomile Extract",
    origin: "Matricaria chamomilla flower extract, traditionally used in gentle skin care formulations.",
    purpose: "Included in select formulations for its calming and soothing properties on sensitive skin.",
    benefits: [
      "Calming effect on skin",
      "Traditionally used for sensitive skin",
      "Gentle botanical care",
    ],
    safetyProfile:
      "Chamomile extract is used at low concentrations in baby products. Individuals with known Asteraceae allergies should perform a patch test.",
    skinCompatibility: "Generally well tolerated; recommended patch test for known botanical sensitivities.",
    suitableAge: "3 months and above",
    researchSummary:
      "Chamomile contains bisabolol and chamazulene, compounds studied for their anti-inflammatory and soothing properties in topical applications.",
    relatedProducts: [
      { name: "Gentle Baby Wash", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.ingredientOat.url,
    imageAlt: "Chamomile extract for soothing baby care",
  },
  {
    id: "glycerin",
    name: "Glycerin",
    origin: "Vegetable-derived humectant, widely used in pharmaceutical and cosmetic formulations.",
    purpose: "Draws moisture to the skin surface, helping maintain softness after cleansing.",
    benefits: [
      "Deep hydration support",
      "Prevents dryness after washing",
      "Non-comedogenic humectant",
    ],
    safetyProfile:
      "Glycerin is one of the most widely used and well-studied humectants in skin care, with an excellent safety profile for all ages.",
    skinCompatibility: "Highly compatible with baby skin; supports moisture retention without greasiness.",
    suitableAge: "Newborn and above",
    researchSummary:
      "Clinical studies demonstrate glycerin's ability to improve stratum corneum hydration and accelerate barrier recovery in compromised skin.",
    relatedProducts: [
      { name: "Baby Lotion", href: "/products" },
      { name: "Gentle Baby Wash", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.ingredientChamomile.url,
    imageAlt: "Glycerin humectant for baby skin hydration",
  },
  {
    id: "coconut-cleansers",
    name: "Coconut-Derived Cleansers",
    origin: "Mild surfactants derived from coconut oil through a gentle esterification process.",
    purpose: "Provide effective cleansing without the harsh stripping associated with sulfate-based surfactants.",
    benefits: [
      "Effective yet gentle cleansing",
      "Preserves natural skin oils",
      "Low irritation potential",
    ],
    safetyProfile:
      "Coconut-derived glucosides and betaines are preferred in baby wash formulations for their mildness and biodegradability.",
    skinCompatibility: "Designed for daily use on delicate skin without disrupting the lipid barrier.",
    suitableAge: "Newborn and above",
    researchSummary:
      "Research shows alkyl polyglucosides and coco-betaines produce significantly lower irritation scores compared to sodium lauryl sulfate in controlled skin tolerance studies.",
    relatedProducts: [
      { name: "Gentle Baby Wash", href: "/products" },
      { name: "2-in-1 Wash & Shampoo", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.microscope.url,
    imageAlt: "Coconut-derived gentle cleansers",
  },
  {
    id: "calendula",
    name: "Calendula Extract",
    origin: "Calendula officinalis flower extract, a botanical traditionally used in infant skin care.",
    purpose: "Supports skin comfort and is included in formulations designed for sensitive or dry-prone skin.",
    benefits: [
      "Botanical skin comfort",
      "Traditionally used in baby care",
      "Supports skin resilience",
    ],
    safetyProfile:
      "Calendula is used at carefully controlled concentrations. Patch testing is recommended for babies with known botanical allergies.",
    skinCompatibility: "Suitable for normal to sensitive skin types.",
    suitableAge: "3 months and above",
    researchSummary:
      "Calendula extract has been studied for its flavonoid and triterpenoid content, which may contribute to skin soothing properties in topical applications.",
    relatedProducts: [
      { name: "Baby Lotion", href: "/products" },
    ],
    image: CONTENT_EDITORIAL.scientist.url,
    imageAlt: "Calendula botanical extract for baby skin",
  },
];
