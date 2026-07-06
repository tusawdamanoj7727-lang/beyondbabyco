import type { MascotPose, MascotType } from "@/components/mascots";

export type MascotColor = "green" | "terra" | "cream";

export type MascotProfile = {
  slug: string;
  mascotId: MascotType;
  fullName: string;
  personality: string;
  tagline: string;
  categoryLabel: string;
  categorySlug: string;
  associatedProducts: string[];
  funFacts: string[];
  color: MascotColor;
  heroImage: string;
  hubPose: MascotPose;
  relatedSlugs: string[];
};

export const MASCOT_PROFILES: MascotProfile[] = [
  {
    slug: "bella",
    mascotId: "bella-bunny",
    fullName: "Bella Bunny",
    personality: "Warm & welcoming",
    tagline: "Every product should feel as gentle as a first hello.",
    categoryLabel: "Newborn Essentials",
    categorySlug: "baby-wipes",
    associatedProducts: [
      "pure-gentle-water-baby-wipes",
      "sensitive-skin-water-wipes",
      "newborn-essentials-gift-set",
    ],
    funFacts: [
      "Bella was the first mascot drawn for BeyondBabyCo — inspired by a soft toy from our founder's nursery.",
      "She always carries a tiny heart because she believes care starts with warmth, not instructions.",
      "Bella's favourite ritual is the first bath after bringing baby home.",
    ],
    color: "terra",
    heroImage: "/mascots/bella/bella-09-celebration.webp",
    hubPose: "welcome",
    relatedSlugs: ["poppy", "benny"],
  },
  {
    slug: "gigi",
    mascotId: "gigi-giraffe",
    fullName: "Gigi Giraffe",
    personality: "Curious & clear",
    tagline: "Helps families understand ingredients without the jargon.",
    categoryLabel: "Bath Time",
    categorySlug: "baby-wash",
    associatedProducts: [
      "calendula-gentle-baby-wash",
      "organic-botanical-baby-wash",
      "2-in-1-wash-shampoo",
    ],
    funFacts: [
      "Gigi's long neck lets her peek at ingredient lists so parents don't have to squint at fine print.",
      "She keeps a little notebook of every plant extract we research — chamomile is her current favourite.",
      "Gigi believes the best labels use words you would say out loud to your grandmother.",
    ],
    color: "green",
    heroImage: "/mascots/gigi/gigi-09-celebration.webp",
    hubPose: "reading",
    relatedSlugs: ["eli", "penny"],
  },
  {
    slug: "poppy",
    mascotId: "poppy-panda",
    fullName: "Poppy Panda",
    personality: "Calm & cozy",
    tagline: "Celebrates the quiet rituals — bath time, bedtime, and in-between.",
    categoryLabel: "Bedtime & Lotion",
    categorySlug: "baby-lotion",
    associatedProducts: [
      "shea-butter-baby-lotion",
      "sensitive-daily-lotion",
      "soothing-night-cream",
    ],
    funFacts: [
      "Poppy naps between product shoots — she says rest is part of the routine too.",
      "Her favourite scent notes are lavender and vanilla, never overpowering.",
      "Poppy always reminds us that a calm parent makes for a calmer baby.",
    ],
    color: "cream",
    heroImage: "/mascots/poppy/poppy-09-celebration.webp",
    hubPose: "sleeping",
    relatedSlugs: ["bella", "benny"],
  },
  {
    slug: "eli",
    mascotId: "eli-elephant",
    fullName: "Eli Elephant",
    personality: "Thoughtful & trusted",
    tagline: "Turns formulation science into stories parents can trust.",
    categoryLabel: "Research & Oils",
    categorySlug: "baby-oil",
    associatedProducts: [
      "coconut-nourishing-baby-oil",
      "ayurvedic-massage-oil",
      "diaper-rash-protection-cream",
    ],
    funFacts: [
      "Eli never forgets a study — his memory is how we keep five years of research organised.",
      "He reads every dermatology report twice before we call a formula 'gentle'.",
      "Eli's trunk holds a magnifying glass for inspecting ingredient purity certificates.",
    ],
    color: "green",
    heroImage: "/mascots/eli/eli-09-celebration.webp",
    hubPose: "studying",
    relatedSlugs: ["gigi", "penny"],
  },
  {
    slug: "penny",
    mascotId: "penny-penguin",
    fullName: "Penny Penguin",
    personality: "Helpful & precise",
    tagline: "Introduces each formula with clarity and a little delight.",
    categoryLabel: "Daily Care",
    categorySlug: "baby-powder",
    associatedProducts: [
      "natural-talc-free-powder",
      "zinc-diaper-rash-cream",
      "diaper-rash-protection-cream",
    ],
    funFacts: [
      "Penny waddles through our warehouse to make sure every pack is sealed just right.",
      "She loves comparing two products side-by-side so parents can choose confidently.",
      "Penny's favourite pose is 'hold-product' — she treats every bottle like a treasure.",
    ],
    color: "terra",
    heroImage: "/mascots/penny/penny-09-celebration.webp",
    hubPose: "hold-product",
    relatedSlugs: ["gigi", "eli"],
  },
  {
    slug: "benny",
    mascotId: "benny-bear",
    fullName: "Benny Bear",
    personality: "Joyful & playful",
    tagline: "Marks the small milestones that make parenthood beautiful.",
    categoryLabel: "Gift Sets",
    categorySlug: "gift-sets",
    associatedProducts: [
      "newborn-essentials-gift-set",
      "daily-care-gift-hamper",
      "travel-essentials-kit",
    ],
    funFacts: [
      "Benny throws a little celebration every time a family completes their first order.",
      "He collects stickers from happy customers — his den wall is almost full.",
      "Benny believes the best gifts are the ones that get used every single day.",
    ],
    color: "terra",
    heroImage: "/mascots/benny/benny-09-celebration.webp",
    hubPose: "celebration",
    relatedSlugs: ["bella", "poppy"],
  },
];

export const MASCOT_COLOR_STYLES: Record<
  MascotColor,
  { card: string; badge: string; accent: string }
> = {
  green: {
    card: "border-green-200/70 bg-gradient-to-br from-green-50/90 to-cream-50/80",
    badge: "bg-green-100 text-green-800",
    accent: "text-green-700",
  },
  terra: {
    card: "border-terra-200/70 bg-gradient-to-br from-terra-50/80 to-cream-50/90",
    badge: "bg-terra-100 text-terra-800",
    accent: "text-terra-700",
  },
  cream: {
    card: "border-cream-300/80 bg-gradient-to-br from-cream-50 to-white/90",
    badge: "bg-cream-200 text-green-800",
    accent: "text-green-700",
  },
};

export function getAllMascotProfiles(): MascotProfile[] {
  return MASCOT_PROFILES;
}

export function getMascotProfile(slug: string): MascotProfile | undefined {
  return MASCOT_PROFILES.find((m) => m.slug === slug);
}

export function getRelatedMascotProfiles(slug: string): MascotProfile[] {
  const profile = getMascotProfile(slug);
  if (!profile) return [];
  return profile.relatedSlugs
    .map((s) => getMascotProfile(s))
    .filter((m): m is MascotProfile => !!m);
}

export function mascotPagePath(slug: string): string {
  return `/mascots/${slug}`;
}
