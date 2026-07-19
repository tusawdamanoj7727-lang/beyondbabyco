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
  /** Plain-language why this is appropriate for baby care. */
  babySafeExplanation: string;
  researchSummary: string;
  faqs: { question: string; answer: string }[];
  relatedProducts: { name: string; href: string }[];
  image: string;
  imageAlt: string;
};

export function getIngredientById(id: string): IngredientProfile | undefined {
  return CORE_INGREDIENTS.find((i) => i.id === id);
}

export function getAllIngredientIds(): string[] {
  return CORE_INGREDIENTS.map((i) => i.id);
}

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
    babySafeExplanation:
      "Babies’ skin is thinner and more absorbent than adult skin. A purified-water base keeps cleansing mild and reduces the need for harsh solvents.",
    researchSummary:
      "Water-based formulations are recommended by dermatologists for daily cleansing of infant skin due to their low irritation potential and compatibility with the skin barrier.",
    faqs: [
      {
        question: "Is purified water enough to cleanse effectively?",
        answer:
          "For everyday messes, a high-purity water wipe with a soft fabric can clean gently without stripping oils. Stubborn messes may need a mild wash as part of the bath routine.",
      },
      {
        question: "Can newborns use water-based wipes every day?",
        answer:
          "Yes — when formulated for infant skin and free from harsh additives. Always follow packaging guidance and patch-test if your baby has known sensitivities.",
      },
    ],
    relatedProducts: [{ name: "Shop wipes & care", href: "/products" }],
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
    babySafeExplanation:
      "Aloe is included for comfort and hydration support — not as a medical treatment. We use purified extract at baby-appropriate levels.",
    researchSummary:
      "Studies indicate aloe vera contains polysaccharides and glycoproteins that support skin hydration and may help reduce mild irritation from environmental exposure.",
    faqs: [
      {
        question: "Is aloe safe for newborn skin?",
        answer:
          "Purified, cosmetic-grade aloe extracts are commonly used in baby care. Discontinue use and consult your paediatrician if irritation occurs.",
      },
      {
        question: "Does aloe replace moisturiser?",
        answer:
          "Aloe can support hydration in a formula, but dry skin may still need a dedicated baby lotion as part of your routine.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
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
    babySafeExplanation:
      "Vitamin E helps protect formula oils and supports skin softness. We use it at concentrations suitable for delicate skin — not as a high-dose treatment.",
    researchSummary:
      "Vitamin E is an established antioxidant in dermatology, known for its role in protecting lipids in the skin barrier from free radical damage.",
    faqs: [
      {
        question: "Will Vitamin E clog baby pores?",
        answer:
          "At the low levels used in baby care, tocopherol is generally well tolerated and used to support softness rather than leave a heavy film.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
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
    babySafeExplanation:
      "Chamomile is a classic soothing botanical. We keep levels modest and recommend patch testing if your family has flower allergies.",
    researchSummary:
      "Chamomile contains bisabolol and chamazulene, compounds studied for their anti-inflammatory and soothing properties in topical applications.",
    faqs: [
      {
        question: "My baby has plant allergies — can we use chamomile?",
        answer:
          "If there is a known Asteraceae (daisy family) allergy, patch-test first or choose a product without chamomile. Ask your paediatrician when unsure.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
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
    babySafeExplanation:
      "Glycerin helps skin hold onto water after cleansing — useful in dry climates and after bath time.",
    researchSummary:
      "Clinical studies demonstrate glycerin's ability to improve stratum corneum hydration and accelerate barrier recovery in compromised skin.",
    faqs: [
      {
        question: "Is glycerin sticky on baby skin?",
        answer:
          "In well-balanced baby formulas, glycerin supports softness without a heavy sticky feel when used at appropriate levels.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
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
    babySafeExplanation:
      "These mild cleansers lift dirt and milk residue while aiming to respect baby’s natural skin barrier — unlike harsh sulfates.",
    researchSummary:
      "Research shows alkyl polyglucosides and coco-betaines produce significantly lower irritation scores compared to sodium lauryl sulfate in controlled skin tolerance studies.",
    faqs: [
      {
        question: "Are coconut cleansers the same as coconut oil?",
        answer:
          "No. They are mild surfactants derived from coconut chemistry, used for cleansing — not the same as applying coconut oil as a moisturiser.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
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
    babySafeExplanation:
      "Calendula has a long tradition in infant care for comfort. We use controlled amounts and suggest patch testing when botanical allergies exist.",
    researchSummary:
      "Calendula extract has been studied for its flavonoid and triterpenoid content, which may contribute to skin soothing properties in topical applications.",
    faqs: [
      {
        question: "Can calendula treat rashes?",
        answer:
          "BeyondBabyCo products are for gentle care — not medical treatment. Persistent rashes need paediatric advice.",
      },
    ],
    relatedProducts: [{ name: "Shop products", href: "/products" }],
    image: CONTENT_EDITORIAL.scientist.url,
    imageAlt: "Calendula botanical extract for baby skin",
  },
];
