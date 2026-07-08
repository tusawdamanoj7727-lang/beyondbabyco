/**
 * Phase 11.3 — Complete image catalog for AI Asset Studio.
 */

import type { AssetCategory } from "./art-direction";
import type { ProductAngle, PromptTemplateId } from "./prompt-templates";

export type AssetEntry = {
  id: string;
  category: AssetCategory;
  slug: string;
  template: PromptTemplateId;
  subject: string;
  width: number;
  height: number;
  vars?: Record<string, string>;
  productLine?: string;
  angle?: ProductAngle;
  alt: string;
};

export const PRODUCT_LINES = [
  { slug: "baby-wipes", name: "Baby Wipes", category: "baby-wipes" as const },
  { slug: "baby-wash", name: "Baby Wash", category: "baby-wash" as const },
  { slug: "baby-lotion", name: "Baby Lotion", category: "baby-lotion" as const },
  { slug: "baby-shampoo", name: "Baby Shampoo", category: "baby-shampoo" as const },
  { slug: "baby-oil", name: "Baby Oil", category: "baby-oil" as const },
  { slug: "baby-powder", name: "Baby Powder", category: "baby-powder" as const },
  { slug: "gift-box", name: "Gift Box", category: "gift" as const },
  { slug: "newborn-kit", name: "Newborn Kit", category: "gift" as const },
] as const;

const PRODUCT_ANGLES: ProductAngle[] = [
  "front",
  "front-45",
  "back",
  "top",
  "lifestyle",
  "packaging-closeup",
  "transparent-png",
  "white-background",
];

function productAssets(): AssetEntry[] {
  const entries: AssetEntry[] = [];
  for (const line of PRODUCT_LINES) {
    for (const angle of PRODUCT_ANGLES) {
      entries.push({
        id: `products/${line.slug}/${angle}`,
        category: "products",
        slug: `${line.slug}/${angle}`,
        template: "product",
        subject: `${line.name} ${angle.replace(/-/g, " ")}`,
        width: 1024,
        height: 1024,
        productLine: line.slug,
        angle,
        vars: { product: line.name, angle: angle.replace(/-/g, " ") },
        alt: `${line.name} — ${angle.replace(/-/g, " ")} editorial render | BeyondBabyCo`,
      });
    }
  }
  return entries;
}

function catalogEntries(
  category: AssetCategory,
  template: PromptTemplateId,
  items: Array<{ slug: string; subject: string; w?: number; h?: number }>,
): AssetEntry[] {
  return items.map((item) => ({
    id: `${category}/${item.slug}`,
    category,
    slug: item.slug,
    template,
    subject: item.subject,
    width: item.w ?? 1280,
    height: item.h ?? 960,
    alt: `${item.subject} | BeyondBabyCo editorial`,
  }));
}

const HERO = catalogEntries("hero", "hero", [
  { slug: "gentle-care-hero", subject: "mother cradling newborn in cream nursery morning light", w: 1920, h: 1080 },
  { slug: "science-backed-hero", subject: "research and care dual narrative soft botanical props", w: 1920, h: 1080 },
  { slug: "collection-hero", subject: "curated baby care collection on wood table botanical", w: 1920, h: 1080 },
  { slug: "family-morning-hero", subject: "Indian family morning routine premium home", w: 1920, h: 1080 },
]);

const LIFESTYLE = catalogEntries("lifestyle", "lifestyle", [
  { slug: "diaper-change", subject: "mother changing diaper calm nursery natural expression" },
  { slug: "bath-time", subject: "gentle bath time father supporting baby warm bathroom" },
  { slug: "applying-lotion", subject: "mother applying lotion on baby tender care cotton towel" },
  { slug: "baby-sleeping", subject: "peaceful sleeping baby cream linen nursery soft light" },
  { slug: "nursery", subject: "minimal premium nursery sage cream decor empty changing area" },
  { slug: "morning-routine", subject: "morning sunlight family care routine premium home" },
  { slug: "father-holding-baby", subject: "Indian father holding baby quiet bond no studio pose" },
  { slug: "family", subject: "Indian family together premium home natural warmth" },
  { slug: "organic-ingredients", subject: "organic botanical ingredients flat lay wood table" },
  { slug: "premium-home", subject: "premium Indian home interior uncluttered warm white" },
]);

const RESEARCH = catalogEntries("research", "research", [
  { slug: "lab-bench", subject: "clean research bench formulation notes soft editorial" },
  { slug: "ingredient-study", subject: "ingredient sourcing and analysis natural botanicals" },
  { slug: "safety-testing", subject: "gentle safety testing visual no medical claims" },
  { slug: "parent-feedback", subject: "parent research session calm premium setting" },
  { slug: "formulation", subject: "formulation development cream texture study" },
]);

const SCIENCE = catalogEntries("science", "science", [
  { slug: "scientist-portrait", subject: "scientist in clean lab coat soft editorial portrait" },
  { slug: "dermatologist", subject: "dermatologist reviewing gentle care samples premium clinic aesthetic" },
  { slug: "microscope", subject: "microscope ingredient analysis macro detail" },
  { slug: "lab-environment", subject: "modern research lab warm white not cold clinical" },
  { slug: "testing", subject: "product testing gentle skin compatibility visual" },
  { slug: "ingredient-research", subject: "ingredient research botanical and molecular story editorial" },
]);

const INGREDIENTS = catalogEntries("ingredients", "macro-ingredient", [
  { slug: "calendula", subject: "calendula flower macro golden petals water droplets", w: 1024, h: 1024 },
  { slug: "oat-extract", subject: "oat extract creamy texture macro organic", w: 1024, h: 1024 },
  { slug: "chamomile", subject: "chamomile blossom macro soft white yellow center", w: 1024, h: 1024 },
  { slug: "aloe-vera", subject: "aloe vera gel slice macro translucent green", w: 1024, h: 1024 },
  { slug: "coconut-oil", subject: "coconut oil golden drops macro nourishing", w: 1024, h: 1024 },
  { slug: "shea-butter", subject: "shea butter creamy swirl macro texture", w: 1024, h: 1024 },
]);

const NEWSLETTER = catalogEntries("newsletter", "newsletter", [
  { slug: "research-updates", subject: "research updates invitation calm cream banner", w: 1280, h: 720 },
  { slug: "new-arrivals", subject: "new collection announcement soft botanical", w: 1280, h: 720 },
  { slug: "care-tips", subject: "gentle care tips editorial newsletter header", w: 1280, h: 720 },
]);

const TIMELINE = catalogEntries("timeline", "timeline", [
  { slug: "founding", subject: "brand founding story parents and research origin" },
  { slug: "first-formulation", subject: "first gentle formulation milestone editorial" },
  { slug: "dermatology-review", subject: "dermatology review milestone trust visual" },
  { slug: "community-launch", subject: "community of parents launch moment" },
  { slug: "today", subject: "present day research-led baby care collection" },
]);

const CATEGORIES = catalogEntries("categories", "category", [
  { slug: "baby-wipes", subject: "baby wipes category collection hero soft pack composition" },
  { slug: "baby-wash", subject: "baby wash category bath time gentle cleansing" },
  { slug: "baby-shampoo", subject: "baby shampoo category tear-free hair care" },
  { slug: "baby-lotion", subject: "baby lotion category daily moisture ritual" },
  { slug: "baby-oil", subject: "baby oil category massage nourishment" },
  { slug: "baby-powder", subject: "baby powder category talc-free comfort" },
  { slug: "gift-sets", subject: "gift sets category premium ribbon cream paper" },
]);

const TRUST = catalogEntries("trust", "trust", [
  { slug: "dermatologist-tested", subject: "dermatologist tested badge visual premium editorial" },
  { slug: "hypoallergenic", subject: "hypoallergenic gentle formula trust visual" },
  { slug: "no-toxins", subject: "free from harsh ingredients clean formula story" },
  { slug: "parent-approved", subject: "parent approved authentic Indian family trust" },
  { slug: "research-backed", subject: "research backed science credibility editorial" },
]);

const MARKETING = catalogEntries("marketing", "marketing", [
  { slug: "hero-banner", subject: "wide cinematic hero banner negative space left third", w: 1920, h: 800 },
  { slug: "social-square", subject: "square social product composition centered", w: 1024, h: 1024 },
  { slug: "campaign-spring", subject: "spring campaign botanical sage cream", w: 1280, h: 960 },
  { slug: "campaign-gift", subject: "gift season premium ribbon composition", w: 1280, h: 960 },
  { slug: "floating-product", subject: "floating product soft shadow minimal premium", w: 1024, h: 1024 },
]);

const BACKGROUNDS = catalogEntries("backgrounds", "background", [
  { slug: "nursery", subject: "minimal nursery cream sage empty surface product placement", w: 1920, h: 1080 },
  { slug: "bathroom", subject: "luxury bathroom marble shelf soft steam light empty", w: 1920, h: 1080 },
  { slug: "wood-table", subject: "natural wood table botanical props empty center", w: 1920, h: 1080 },
  { slug: "cotton-towel", subject: "white cotton towel spa composition soft folds", w: 1920, h: 1080 },
  { slug: "cream-wall", subject: "warm cream wall soft shadow minimal", w: 1920, h: 1080 },
  { slug: "botanical", subject: "botanical eucalyptus cotton stems cream backdrop", w: 1920, h: 1080 },
  { slug: "premium-home", subject: "premium Indian home interior uncluttered warm", w: 1920, h: 1080 },
]);

const DECORATIVE = catalogEntries("decorative", "decorative", [
  { slug: "botanical-illustration", subject: "botanical illustration sage eucalyptus line art soft", w: 1024, h: 1024 },
  { slug: "leaf-overlay", subject: "leaf overlay transparent-style organic sage", w: 1024, h: 1024 },
  { slug: "organic-blob", subject: "organic blob shape cream sage gradient soft", w: 1024, h: 1024 },
  { slug: "glass-reflection", subject: "glass reflection premium UI overlay subtle", w: 1024, h: 1024 },
  { slug: "water-ripples", subject: "water ripples macro clean fresh texture", w: 1024, h: 1024 },
  { slug: "cotton-texture", subject: "cotton fabric texture macro warm white", w: 1024, h: 1024 },
  { slug: "cream-paper", subject: "cream paper texture subtle grain premium", w: 1024, h: 1024 },
  { slug: "noise-texture", subject: "fine film grain noise overlay warm neutral", w: 512, h: 512 },
  { slug: "decorative-shadow", subject: "soft decorative shadow ellipse premium UI", w: 1024, h: 256 },
  { slug: "premium-gradient", subject: "premium gradient ivory cream sage vertical", w: 1920, h: 1080 },
]);

const MASCOTS = catalogEntries("mascots", "decorative", [
  { slug: "gentle-bear", subject: "soft premium baby brand mascot gentle bear minimal not cartoonish", w: 1024, h: 1024 },
  { slug: "botanical-friend", subject: "botanical mascot sage leaf character minimal premium", w: 1024, h: 1024 },
]);

const SOCIAL = catalogEntries("social", "marketing", [
  { slug: "instagram-story", subject: "vertical story format product lifestyle", w: 1080, h: 1920 },
  { slug: "instagram-feed", subject: "square feed post product editorial", w: 1080, h: 1080 },
  { slug: "pinterest-pin", subject: "tall pin format care tips visual", w: 1000, h: 1500 },
]);

const CAMPAIGNS = catalogEntries("campaigns", "marketing", [
  { slug: "launch", subject: "brand launch campaign hero wide", w: 1920, h: 1080 },
  { slug: "monsoon-care", subject: "monsoon season gentle skin care campaign", w: 1280, h: 960 },
]);

const COMMUNITY = catalogEntries("community", "lifestyle", [
  { slug: "parent-circle", subject: "parents community gathering warm premium home", w: 1280, h: 960 },
  { slug: "care-sharing", subject: "parents sharing care tips authentic moment", w: 1280, h: 960 },
]);

const REVIEWS = catalogEntries("reviews", "trust", [
  { slug: "testimonial-backdrop", subject: "soft backdrop for customer testimonial cards", w: 1280, h: 720 },
  { slug: "five-star-moment", subject: "authentic parent satisfaction quiet joy nursery", w: 1280, h: 960 },
]);

const GIFT = catalogEntries("gift", "lifestyle", [
  { slug: "gift-box-hero", subject: "premium gift box ribbon cream paper composition", w: 1280, h: 960 },
  { slug: "newborn-kit-flatlay", subject: "newborn essentials kit flat lay wood table", w: 1280, h: 960 },
  { slug: "hamper-unboxing", subject: "gift hamper unboxing moment soft morning light", w: 1280, h: 960 },
]);

export const ASSET_CATALOG: AssetEntry[] = [
  ...HERO,
  ...LIFESTYLE,
  ...RESEARCH,
  ...SCIENCE,
  ...productAssets(),
  ...INGREDIENTS,
  ...NEWSLETTER,
  ...TIMELINE,
  ...CATEGORIES,
  ...TRUST,
  ...MASCOTS,
  ...BACKGROUNDS,
  ...DECORATIVE,
  ...MARKETING,
  ...SOCIAL,
  ...CAMPAIGNS,
  ...COMMUNITY,
  ...REVIEWS,
  ...GIFT,
];

export function getAssetsByCategory(category: AssetCategory): AssetEntry[] {
  return ASSET_CATALOG.filter((a) => a.category === category);
}

export function getAssetCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const asset of ASSET_CATALOG) {
    counts[asset.category] = (counts[asset.category] ?? 0) + 1;
  }
  return counts;
}

export const ASSET_CATALOG_TOTAL = ASSET_CATALOG.length;

export const NPM_CATEGORY_MAP: Record<string, AssetCategory[]> = {
  hero: ["hero"],
  lifestyle: ["lifestyle"],
  products: ["products"],
  research: ["research"],
  science: ["science"],
  ingredients: ["ingredients"],
  timeline: ["timeline"],
  newsletter: ["newsletter"],
  trust: ["trust"],
  marketing: ["marketing", "social", "campaigns"],
};
