export type MascotContent = {
  name: string;
  personality: string;
  color: string;
  image: string;
  celebrationImg: string;
  tagline: string;
  story: string;
  products: string[];
};

export const MASCOTS: Record<string, MascotContent> = {
  bella: {
    name: "Bella Bunny",
    personality: "Comfort & Care",
    color: "#FFB6C1",
    image: "/icons/bella-bunny/default.webp",
    celebrationImg: "/icons/bella-bunny/celebration.webp",
    tagline: "Warm welcomes, gentle touch",
    story:
      "Bella reminds us that every product should feel as soft as a first hello. She represents comfort, care, and the warmth every baby deserves.",
    products: ["Baby Wipes", "Baby Lotion", "Baby Wash"],
  },
  eli: {
    name: "Eli Elephant",
    personality: "Safety & Research",
    color: "#87CEEB",
    image: "/icons/eli-elephant/default.webp",
    celebrationImg: "/icons/eli-elephant/studying.webp",
    tagline: "5 years of research, zero compromises",
    story:
      "Eli turns complex formulation science into stories parents can trust. He represents our commitment to research-backed baby care.",
    products: ["Ayurvedic Massage Oil", "Baby Shampoo"],
  },
  gigi: {
    name: "Gigi Giraffe",
    personality: "Learning & Growth",
    color: "#FFD700",
    image: "/icons/gigi-giraffe/default.webp",
    celebrationImg: "/icons/gigi-giraffe/reading.webp",
    tagline: "Growing together, learning every day",
    story:
      "Gigi helps families understand ingredients without the jargon. Every label should be readable by every parent.",
    products: ["Baby Cream", "Gift Sets"],
  },
  poppy: {
    name: "Poppy Panda",
    personality: "Gentleness & Calm",
    color: "#98FB98",
    image: "/icons/poppy-panda/default.webp",
    celebrationImg: "/icons/poppy-panda/sleeping.webp",
    tagline: "Calm routines, peaceful moments",
    story:
      "Poppy celebrates quiet rituals — bath time, bedtime, and every peaceful moment between busy days.",
    products: ["Baby Lotion", "Baby Cream"],
  },
  penny: {
    name: "Penny Penguin",
    personality: "Product Discovery",
    color: "#DDA0DD",
    image: "/icons/penny-penguin/default.webp",
    celebrationImg: "/icons/penny-penguin/hold-product.webp",
    tagline: "Discovering the perfect formula for your baby",
    story:
      "Penny introduces each formula with clarity. She makes sure every parent finds exactly what their baby needs.",
    products: ["All Products"],
  },
  benny: {
    name: "Benny Bear",
    personality: "Everyday Joy",
    color: "#F4A460",
    image: "/icons/benny-bear/default.webp",
    celebrationImg: "/icons/benny-bear/celebration.webp",
    tagline: "Every day is worth celebrating",
    story:
      "Benny marks the small milestones that make parenthood beautiful. First bath, first smile, first everything.",
    products: ["Gift Sets", "All Products"],
  },
};

export const MASCOT_SLUGS = Object.keys(MASCOTS);

export function getMascotContent(slug: string): MascotContent | undefined {
  return MASCOTS[slug];
}
