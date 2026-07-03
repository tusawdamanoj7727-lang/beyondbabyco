import type { ContentLink } from "@/lib/content/types";
import { TRUST_IMAGES } from "./images";

export type ResearchProcessStep = {
  id: string;
  title: string;
  description: string;
  illustration: string;
  illustrationAlt: string;
  icon: string;
  cta: ContentLink;
  phase: number;
};

export const RESEARCH_PROCESS_STEPS: ResearchProcessStep[] = [
  {
    id: "research",
    phase: 1,
    title: "Research",
    description:
      "We begin every product with a deep study of infant skin biology, common sensitivities, and the latest dermatological literature — ensuring our work is grounded in science before a single formula is written.",
    illustration: TRUST_IMAGES.research,
    illustrationAlt: "Baby skin research and formulation planning",
    icon: "beaker",
    cta: { label: "Explore Our Research", href: "/research" },
  },
  {
    id: "ingredient-selection",
    phase: 2,
    title: "Ingredient Selection",
    description:
      "Each ingredient is evaluated against our restricted substances list, safety data, and suitability for delicate skin. Only ingredients with a clear purpose and proven safety profile are shortlisted.",
    illustration: TRUST_IMAGES.ingredient,
    illustrationAlt: "Natural ingredient selection for baby care",
    icon: "leaf",
    cta: { label: "View Ingredients", href: "/ingredients" },
  },
  {
    id: "laboratory-testing",
    phase: 3,
    title: "Laboratory Testing",
    description:
      "Formulations undergo rigorous in-lab testing for pH balance, stability, microbial safety, and compatibility with baby skin — long before any product reaches a testing panel.",
    illustration: TRUST_IMAGES.laboratory,
    illustrationAlt: "Laboratory testing of baby care formulations",
    icon: "flask",
    cta: { label: "Safety Standards", href: "/safety-standards" },
  },
  {
    id: "safety-verification",
    phase: 4,
    title: "Safety Verification",
    description:
      "Independent safety verification confirms that every formula meets our internal standards and applicable regulatory requirements for infant personal care products in India.",
    illustration: TRUST_IMAGES.safety,
    illustrationAlt: "Safety verification and quality assurance",
    icon: "shield",
    cta: { label: "Certifications", href: "/certifications" },
  },
  {
    id: "dermatologist-review",
    phase: 5,
    title: "Dermatologist Review",
    description:
      "Formulations are reviewed under dermatological supervision to assess irritation potential, sensitisation risk, and overall tolerance on sensitive and newborn skin.",
    illustration: TRUST_IMAGES.dermatology,
    illustrationAlt: "Dermatological review of baby care products",
    icon: "stethoscope",
    cta: { label: "Dermatologically Tested", href: "/trust-center#quality" },
  },
  {
    id: "pediatrician-consultation",
    phase: 6,
    title: "Pediatrician Consultation",
    description:
      "We consult with pediatric health experts on age-appropriate use, application guidance, and formulation suitability — ensuring products align with real-world parenting needs.",
    illustration: TRUST_IMAGES.pediatric,
    illustrationAlt: "Pediatric consultation on product development",
    icon: "heart-pulse",
    cta: { label: "Doctor Advisory", href: "/trust-center#advisory" },
  },
  {
    id: "clinical-validation",
    phase: 7,
    title: "Clinical Validation",
    description:
      "Selected products undergo clinical validation to confirm efficacy and safety under controlled conditions — providing evidence beyond laboratory testing alone.",
    illustration: TRUST_IMAGES.clinical,
    illustrationAlt: "Clinical validation of baby care formulations",
    icon: "clipboard-check",
    cta: { label: "Our Research Process", href: "/trust-center#research" },
  },
  {
    id: "manufacturing",
    phase: 8,
    title: "Manufacturing",
    description:
      "Approved formulas move to GMP-certified manufacturing facilities where batch records, process controls, and in-process testing ensure every unit matches the validated formula.",
    illustration: TRUST_IMAGES.manufacturing,
    illustrationAlt: "GMP manufacturing of baby care products",
    icon: "factory",
    cta: { label: "Manufacturing", href: "/manufacturing" },
  },
  {
    id: "final-quality-check",
    phase: 9,
    title: "Final Quality Check",
    description:
      "Before release, every batch passes final quality inspection — covering packaging integrity, labelling accuracy, sensory evaluation, and compliance with release specifications.",
    illustration: TRUST_IMAGES.quality,
    illustrationAlt: "Final quality check before product release",
    icon: "badge-check",
    cta: { label: "Quality Standards", href: "/trust-center#quality" },
  },
  {
    id: "customer-feedback",
    phase: 10,
    title: "Customer Feedback Loop",
    description:
      "Parent feedback, support enquiries, and product reviews feed directly back into our development cycle — helping us refine formulations and respond to real family needs.",
    illustration: TRUST_IMAGES.feedback,
    illustrationAlt: "Customer feedback and continuous improvement",
    icon: "message-circle",
    cta: { label: "Share Your Experience", href: "/contact" },
  },
];

export const RESEARCH_PROCESS_FAQ = [
  {
    question: "How long does the research process take?",
    answer:
      "BeyondBabyCo invested five years in research before launch. Each new product follows the same rigorous 10-step process, which typically spans several months from concept to release.",
  },
  {
    question: "Are products tested on animals?",
    answer:
      "No. BeyondBabyCo is cruelty free. Safety is validated through approved dermatological, laboratory, and clinical methods — never through animal testing.",
  },
  {
    question: "Can I see the research behind a specific product?",
    answer:
      "Yes. Every product page includes ingredient details, safety information, and research summaries. Visit our Ingredients and Research pages for more.",
  },
];
