import { RESEARCH_TIMELINE } from "@/lib/data";
import { brandSupportEmail } from "@/lib/brand/contact";
import { CONTENT_IMAGES, TRUST_BADGES } from "@/lib/content/images";
import type { ContentPage } from "@/lib/content/types";

export const researchPage: ContentPage = {
  slug: "research",
  title: "Research",
  description:
    "Five years of baby skin science, ingredient testing, and formulation development — the research foundation behind every BeyondBabyCo product.",
  eyebrow: "Science & Innovation",
  heroImage: CONTENT_IMAGES.research,
  jsonLd: "article",
  relatedLinks: [
    { label: "Trust Center", href: "/trust-center" },
    { label: "Ingredients", href: "/ingredients" },
    { label: "Safety Standards", href: "/safety-standards" },
    { label: "Manufacturing", href: "/manufacturing" },
    { label: "Learn", href: "/learn" },
    { label: "Help Center", href: "/help" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "At BeyondBabyCo, research is not a marketing word — it is our starting point. Before any product reaches your home, it passes through years of ingredient evaluation, formulation refinement, and safety validation.",
        "Our research programme focuses on three areas: understanding infant skin biology, identifying safe and effective ingredients, and developing gentle formulations that perform without compromise.",
      ],
    },
    { type: "researchProcess" },
    {
      type: "cards",
      title: "Our research pillars",
      columns: 3,
      items: [
        {
          icon: "beaker",
          title: "Skin Science",
          description:
            "Studying the unique properties of baby skin — thinner epidermis, higher permeability, and developing microbiome.",
        },
        {
          icon: "flask",
          title: "Ingredient Safety",
          description:
            "Evaluating every ingredient against dermatological safety data, regulatory guidelines, and our internal standards.",
        },
        {
          icon: "shield",
          title: "Efficacy Testing",
          description:
            "Confirming that gentle formulations deliver the cleansing, moisturising, and protection parents expect.",
        },
      ],
    },
    {
      type: "timeline",
      title: "Research timeline",
      description: "From first question to finished product — our five-year journey.",
      items: RESEARCH_TIMELINE,
    },
    {
      type: "imageSplit",
      title: "Lab to label",
      paragraphs: [
        "Every BeyondBabyCo product carries the weight of this research. Our 99% Pure Water Baby Wipes, for example, were developed after studying the ideal pH balance, fabric softness, and preservative systems for daily use on newborn skin.",
        "We publish ingredient details and safety information on every product page — because research only matters if parents can see it.",
      ],
      image: CONTENT_IMAGES.scienceLab,
      imageAlt: "BeyondBabyCo research and formulation laboratory",
    },
    {
      type: "cta",
      title: "See research in action",
      description: "Explore products built on five years of science.",
      primary: { label: "Shop Products", href: "/products" },
      secondary: { label: "View Ingredients", href: "/ingredients" },
    },
  ],
};

export const ingredientsPage: ContentPage = {
  slug: "ingredients",
  title: "Ingredients",
  description:
    "Every BeyondBabyCo ingredient is chosen for safety and purpose. Learn about our clean formulation philosophy and key ingredients.",
  eyebrow: "Clean Formulations",
  heroImage: CONTENT_IMAGES.ingredients,
  jsonLd: "article",
  relatedLinks: [
    { label: "Trust Center", href: "/trust-center" },
    { label: "Research", href: "/research" },
    { label: "Safety Standards", href: "/safety-standards" },
    { label: "Learn hub", href: "/learn" },
    { label: "Help Center", href: "/help" },
    { label: "Why BeyondBabyCo", href: "/why-beyondbabyco" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "We believe parents should know exactly what is in every product they use on their baby. BeyondBabyCo formulations use carefully selected ingredients — each chosen for a specific purpose and evaluated for safety on delicate skin.",
        "We avoid parabens, sulfates, phthalates, and harsh alcohols. When an ingredient is included, it is there because it serves your baby — not because it is cheap or easy.",
      ],
    },
    { type: "ingredientTransparency" },
    {
      type: "cards",
      title: "What we never use",
      columns: 3,
      items: [
        {
          image: TRUST_BADGES.parabenFree,
          imageAlt: "Paraben free",
          title: "Parabens",
          description: "Preservatives we choose not to include in any formulation.",
        },
        {
          image: TRUST_BADGES.sulfateFree,
          imageAlt: "Sulfate free",
          title: "Sulfates",
          description: "Harsh cleansing agents replaced with coconut-derived alternatives.",
        },
        {
          image: TRUST_BADGES.crueltyFree,
          imageAlt: "Cruelty free",
          title: "Animal Testing",
          description: "We never test on animals. Safety is validated through approved methods.",
        },
      ],
    },
    {
      type: "cta",
      title: "Full ingredient lists on every product",
      description: "Visit any product page for complete ingredient disclosure.",
      primary: { label: "Browse Products", href: "/products" },
      secondary: { label: "Safety Standards", href: "/safety-standards" },
    },
  ],
};

export const manufacturingPage: ContentPage = {
  slug: "manufacturing",
  title: "Manufacturing",
  description:
    "BeyondBabyCo products are manufactured in GMP-certified facilities in India with strict quality control at every stage.",
  eyebrow: "Quality Production",
  heroImage: CONTENT_IMAGES.manufacturing,
  jsonLd: "article",
  relatedLinks: [
    { label: "Trust Center", href: "/trust-center" },
    { label: "Certifications", href: "/certifications" },
    { label: "Safety Standards", href: "/safety-standards" },
    { label: "About Us", href: "/about" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "Great research means nothing without great manufacturing. BeyondBabyCo partners with certified production facilities that meet Good Manufacturing Practice (GMP) standards — ensuring every batch is consistent, safe, and traceable.",
        "From raw material intake to final packaging, our quality systems monitor every step of the production process.",
      ],
    },
    { type: "manufacturingStory" },
    {
      type: "cards",
      title: "Our manufacturing process",
      columns: 2,
      items: [
        {
          icon: "shield",
          title: "Raw Material Verification",
          description:
            "Every incoming ingredient is tested for identity, purity, and compliance before entering production.",
        },
        {
          icon: "beaker",
          title: "Controlled Formulation",
          description:
            "Precise batch records ensure each product matches its approved formula exactly.",
        },
        {
          icon: "flask",
          title: "In-Process Testing",
          description:
            "Quality checks at multiple stages — pH, viscosity, microbial limits, and sensory evaluation.",
        },
        {
          icon: "sparkles",
          title: "Final Release Testing",
          description:
            "No product ships until it passes stability, safety, and packaging integrity tests.",
        },
      ],
    },
    {
      type: "imageSplit",
      title: "Made in India, built to global standards",
      paragraphs: [
        "We are proud to manufacture in India. Our production partners combine local expertise with internationally recognised quality systems, giving Indian families access to world-class baby care without compromise.",
        "Full batch traceability means that if a question ever arises, we can identify exactly when and where a product was made.",
      ],
      image: CONTENT_IMAGES.manufacturing,
      imageAlt: "BeyondBabyCo GMP manufacturing facility",
      reverse: true,
    },
    {
      type: "cta",
      title: "Quality you can trust",
      description: "Explore our certifications and safety standards.",
      primary: { label: "View Certifications", href: "/certifications" },
      secondary: { label: "Safety Standards", href: "/safety-standards" },
    },
  ],
};

export const certificationsPage: ContentPage = {
  slug: "certifications",
  title: "Certifications",
  description:
    "BeyondBabyCo meets rigorous quality and safety standards. View our certifications including GMP, ISO, and dermatological testing.",
  eyebrow: "Verified Quality",
  heroImage: CONTENT_IMAGES.certifications,
  jsonLd: "article",
  relatedLinks: [
    { label: "Safety Standards", href: "/safety-standards" },
    { label: "Manufacturing", href: "/manufacturing" },
    { label: "Why BeyondBabyCo", href: "/why-beyondbabyco" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "Certifications are not badges we collect — they are independent confirmations that our processes meet recognised standards. BeyondBabyCo and our manufacturing partners maintain certifications across quality management, good manufacturing practice, and product safety testing.",
      ],
    },
    {
      type: "trustBadges",
      title: "Our certifications & standards",
      description: "Each badge represents a verified commitment to quality.",
      badges: [
        {
          image: TRUST_BADGES.gmpManufacturing,
          title: "GMP Certified",
          description: "Good Manufacturing Practice",
          imageAlt: "GMP manufacturing certification",
        },
        {
          image: TRUST_BADGES.isoQuality,
          title: "ISO Quality",
          description: "Quality management systems",
          imageAlt: "ISO quality certification",
        },
        {
          image: TRUST_BADGES.dermatologicallyTested,
          title: "Dermatologically Tested",
          description: "Independent skin safety testing",
          imageAlt: "Dermatologically tested",
        },
        {
          image: TRUST_BADGES.clinicallyTested,
          title: "Clinically Tested",
          description: "Efficacy and safety validation",
          imageAlt: "Clinically tested",
        },
        {
          image: TRUST_BADGES.pediatricianRecommended,
          title: "Pediatrician Recommended",
          description: "Reviewed by child health experts",
          imageAlt: "Pediatrician recommended",
        },
      ],
    },
    {
      type: "intro",
      title: "What these mean for you",
      paragraphs: [
        "GMP certification ensures our manufacturing facilities follow strict protocols for cleanliness, documentation, and process control.",
        "ISO quality standards govern our overall quality management system — from supplier selection to customer feedback.",
        "Dermatological and clinical testing confirms that our products are safe and suitable for use on baby skin under normal conditions.",
        `For specific certification documents related to a product, please contact us at ${brandSupportEmail()}.`,
      ],
    },
    {
      type: "cta",
      title: "Trust backed by proof",
      description: "Shop products made under certified quality systems.",
      primary: { label: "Shop Products", href: "/products" },
      secondary: { label: "Contact Us", href: "/contact" },
    },
  ],
};

export const safetyStandardsPage: ContentPage = {
  slug: "safety-standards",
  title: "Safety Standards",
  description:
    "BeyondBabyCo safety standards cover dermatological testing, ingredient screening, stability testing, and regulatory compliance for baby care products in India.",
  eyebrow: "Your Baby's Safety",
  heroImage: CONTENT_IMAGES.safety,
  jsonLd: "article",
  relatedLinks: [
    { label: "Trust Center", href: "/trust-center" },
    { label: "Ingredients", href: "/ingredients" },
    { label: "Certifications", href: "/certifications" },
    { label: "FAQ", href: "/faq" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "Your baby's safety is non-negotiable. BeyondBabyCo maintains comprehensive safety standards that exceed regulatory minimums — covering every ingredient, every batch, and every product we create.",
        "We follow guidelines from the Bureau of Indian Standards (BIS), Cosmetic Rules 2020, and international best practices for infant personal care products.",
      ],
    },
    { type: "qualityStandards" },
    { type: "doctorAdvisory", compact: true },
    {
      type: "trustBadges",
      title: "Safety commitments",
      badges: [
        {
          image: TRUST_BADGES.dermatologicallyTested,
          title: "Dermatologically Tested",
          imageAlt: "Dermatologically tested",
        },
        {
          image: TRUST_BADGES.naturalIngredients,
          title: "Natural Ingredients",
          imageAlt: "Natural ingredients",
        },
        {
          image: TRUST_BADGES.parabenFree,
          title: "Paraben Free",
          imageAlt: "Paraben free",
        },
        {
          image: TRUST_BADGES.crueltyFree,
          title: "Cruelty Free",
          imageAlt: "Cruelty free",
        },
        {
          image: TRUST_BADGES.madeInIndia,
          title: "Made in India",
          imageAlt: "Made in India",
        },
      ],
    },
    {
      type: "intro",
      title: "Reporting a concern",
      paragraphs: [
        `If you ever experience an adverse reaction or have a safety concern about a BeyondBabyCo product, please stop use immediately and contact us at ${brandSupportEmail()} with the product name, batch number, and details of the reaction.`,
        "We take every report seriously and will investigate promptly. Your feedback helps us maintain the highest safety standards.",
      ],
    },
    {
      type: "cta",
      title: "Questions about safety?",
      description: "Our support team is here to help.",
      primary: { label: "Contact Support", href: "/contact" },
      secondary: { label: "Read FAQ", href: "/faq" },
    },
  ],
};
