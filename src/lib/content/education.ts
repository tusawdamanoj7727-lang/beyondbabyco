/**
 * Education hub — structured stubs for parenting / product education.
 * Expand article bodies over time without changing route structure.
 */

export type EducationCategory =
  | "skincare"
  | "bath"
  | "hair"
  | "seasonal"
  | "sun"
  | "newborn"
  | "usage";

export type EducationArticle = {
  slug: string;
  title: string;
  description: string;
  category: EducationCategory;
  eyebrow: string;
  /** Short reading time hint for UX */
  readingMinutes: number;
  /** Structured sections — keep concise until editorial expands */
  sections: { heading: string; paragraphs: string[] }[];
  relatedLinks: { label: string; href: string }[];
};

export const EDUCATION_CATEGORY_LABELS: Record<EducationCategory, string> = {
  skincare: "Baby skincare basics",
  bath: "Bath routines",
  hair: "Hair care",
  seasonal: "Seasonal care",
  sun: "Sun protection",
  newborn: "Newborn essentials",
  usage: "Product usage",
};

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    slug: "baby-skincare-basics",
    title: "Baby skincare basics",
    description:
      "A gentle primer on baby skin barriers, patch testing, and choosing mild daily care.",
    category: "skincare",
    eyebrow: "Skincare",
    readingMinutes: 4,
    sections: [
      {
        heading: "Why baby skin needs a different approach",
        paragraphs: [
          "Infant skin is thinner and still developing its barrier. Mild cleansers, short baths, and fragrance-light formulas help protect comfort day to day.",
          "When trying anything new, patch-test on a small area and watch for redness or dryness over 24 hours.",
        ],
      },
      {
        heading: "A simple daily rhythm",
        paragraphs: [
          "Cleanse gently, pat dry, moisturise if skin looks dry, and keep nails short. Less is often more — especially in the first months.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Ingredient library", href: "/ingredients" },
      { label: "Safety standards", href: "/safety-standards" },
      { label: "Shop products", href: "/products" },
    ],
  },
  {
    slug: "bath-routines",
    title: "Gentle bath routines",
    description: "How often to bathe, water temperature tips, and keeping bath time calm.",
    category: "bath",
    eyebrow: "Bath",
    readingMinutes: 3,
    sections: [
      {
        heading: "How often is enough?",
        paragraphs: [
          "Most babies do well with a few baths a week plus gentle wipe cleanses between. Follow your paediatrician's guidance for newborns.",
        ],
      },
      {
        heading: "Keep it short and lukewarm",
        paragraphs: [
          "Use lukewarm water, limit time in the tub, and moisturise lightly if skin feels dry afterward. Never leave a baby unattended near water.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Product usage guides", href: "/learn/product-usage-guides" },
      { label: "Shop washes", href: "/products" },
      { label: "Help Center", href: "/help" },
    ],
  },
  {
    slug: "hair-care-guides",
    title: "Baby hair care guides",
    description: "Soft cleansing for delicate scalps and fine baby hair.",
    category: "hair",
    eyebrow: "Hair",
    readingMinutes: 3,
    sections: [
      {
        heading: "Gentle is the goal",
        paragraphs: [
          "Use a mild wash, massage lightly, and rinse thoroughly. Avoid tugging fine hair; a soft brush is usually enough.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Shop products", href: "/products" },
      { label: "Ingredients", href: "/ingredients" },
    ],
  },
  {
    slug: "seasonal-care",
    title: "Seasonal care tips",
    description: "Adjusting baby care for dry winters, humid summers, and changing climates across India.",
    category: "seasonal",
    eyebrow: "Seasonal",
    readingMinutes: 4,
    sections: [
      {
        heading: "Dry months",
        paragraphs: [
          "Shorter baths and a light moisturiser after washing can help when air is dry. Watch for flaky patches on cheeks and limbs.",
        ],
      },
      {
        heading: "Humid months",
        paragraphs: [
          "Keep folds clean and dry. Choose breathable fabrics and avoid heavy layers of product.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Skincare basics", href: "/learn/baby-skincare-basics" },
      { label: "Trust Center", href: "/trust-center" },
    ],
  },
  {
    slug: "sun-protection",
    title: "Sun protection for little ones",
    description: "Shade-first habits and when to ask your paediatrician about sun care.",
    category: "sun",
    eyebrow: "Sun",
    readingMinutes: 3,
    sections: [
      {
        heading: "Shade first",
        paragraphs: [
          "For infants, shade, hats, and timing outdoor activity are the foundation. Ask your paediatrician before using sunscreen products on very young babies.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Newborn essentials", href: "/learn/newborn-essentials" },
      { label: "Contact support", href: "/contact" },
    ],
  },
  {
    slug: "newborn-essentials",
    title: "Newborn care essentials",
    description: "A calm checklist for the first weeks — cleaning, comfort, and when to seek help.",
    category: "newborn",
    eyebrow: "Newborn",
    readingMinutes: 5,
    sections: [
      {
        heading: "Start simple",
        paragraphs: [
          "Soft cloths or gentle wipes, a mild cleanser, and a basic moisturiser cover most everyday needs. Follow hospital or paediatric guidance for cord care and medical concerns.",
        ],
      },
      {
        heading: "When to get advice",
        paragraphs: [
          "Persistent rashes, fever, feeding issues, or breathing concerns need professional care — not product swaps alone.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Shop newborn-friendly care", href: "/products" },
      { label: "Help Center", href: "/help" },
      { label: "About BeyondBabyCo", href: "/about" },
    ],
  },
  {
    slug: "product-usage-guides",
    title: "Product usage guides",
    description: "How to get the most from wipes, washes, and lotions — without overusing.",
    category: "usage",
    eyebrow: "Usage",
    readingMinutes: 4,
    sections: [
      {
        heading: "Follow the label",
        paragraphs: [
          "Each product page includes directions and safety notes. Use small amounts, rinse washes thoroughly, and store products away from heat and direct sun.",
        ],
      },
      {
        heading: "Pair with routines",
        paragraphs: [
          "Wipes for on-the-go cleanses, wash for bath days, lotion when skin feels dry. Explore our ingredient pages if you want to know why a formula feels the way it does.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Ingredient transparency", href: "/ingredients" },
      { label: "FAQ", href: "/faq" },
      { label: "Shop collection", href: "/products" },
    ],
  },
];

export function getEducationArticle(slug: string): EducationArticle | undefined {
  return EDUCATION_ARTICLES.find((a) => a.slug === slug);
}

export function getAllEducationSlugs(): string[] {
  return EDUCATION_ARTICLES.map((a) => a.slug);
}
