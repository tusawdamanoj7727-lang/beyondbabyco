import type { PublicReview } from "@/lib/admin/review-types";

import type {
  CareTip,
  CommunityHighlightItem,
  CommunityStory,
  EnrichedPublicReview,
  GalleryMediaItem,
  ProductQuestion,
} from "./types";

const DEMO_PRODUCT_IDS = {
  gentleWash: "demo-gentle-wash",
  diaperCream: "demo-diaper-cream",
  babyOil: "demo-baby-oil",
} as const;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Demo reviews merged when a product has no approved DB reviews yet. */
export const DEMO_REVIEWS_BY_PRODUCT: Record<string, EnrichedPublicReview[]> = {
  default: [
    {
      id: "demo-review-1",
      productId: "default",
      rating: 5,
      title: "Gentle enough for our newborn",
      body: "We switched from another brand after mild redness. This cleared up within a week of daily use. Texture is light, scent is barely there, and bath time feels calmer.",
      pros: "Hypoallergenic feel, easy rinse, no sticky residue",
      cons: "Pump dispenses a little fast",
      customerName: "Priya M.",
      verifiedPurchase: false,
      isFeatured: true,
      imageUrls: ["/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png"],
      hasVideo: false,
      createdAt: daysAgo(12),
    },
    {
      id: "demo-review-2",
      productId: "default",
      rating: 4,
      title: "Solid everyday staple",
      body: "Works well for our 8-month-old. We use it every night. Would love a travel-size refill pouch.",
      pros: "Reliable quality, dermatologist-tested label gives peace of mind",
      cons: "Wish the bottle were slightly larger",
      customerName: "Ananya K.",
      verifiedPurchase: false,
      isFeatured: false,
      imageUrls: [],
      hasVideo: false,
      createdAt: daysAgo(28),
    },
    {
      id: "demo-review-3",
      productId: "default",
      rating: 5,
      title: "Pediatrician recommended and we agree",
      body: "Our doctor suggested looking for simpler ingredient lists. This checked every box. Skin feels soft without greasiness.",
      pros: "Clean ingredients, fast absorption",
      cons: null,
      customerName: "Rahul & Meera S.",
      verifiedPurchase: false,
      isFeatured: true,
      imageUrls: ["/images/generated/homepage/phase-8-2/lifestyle/lifestyle-08.png", "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-04.png"],
      createdAt: daysAgo(45),
    },
    {
      id: "demo-review-4",
      productId: "default",
      rating: 3,
      title: "Good, not perfect for very dry patches",
      body: "Fine for regular use but we still need a thicker cream on elbows during winter.",
      pros: "Pleasant texture, no irritation",
      cons: "Not rich enough for extreme dryness",
      customerName: "Sneha D.",
      verifiedPurchase: false,
      isFeatured: false,
      imageUrls: [],
      createdAt: daysAgo(60),
    },
    {
      id: "demo-review-5",
      productId: "default",
      rating: 5,
      title: "Gifted to my sister — she reordered",
      body: "Bought as a baby shower gift. She loved the packaging and how quickly it shipped. Zero reactions on sensitive skin.",
      pros: "Premium packaging, trustworthy brand story",
      cons: null,
      customerName: "Kavita R.",
      verifiedPurchase: false,
      isFeatured: false,
      imageUrls: ["/images/generated/homepage/phase-8-2/lifestyle/lifestyle-10.png"],
      createdAt: daysAgo(75),
    },
    {
      id: "demo-review-6",
      productId: "default",
      rating: 4,
      title: "Repeat purchase",
      body: "Second bottle in three months. Consistent quality every time.",
      pros: "Consistent formula, easy to reorder",
      cons: null,
      customerName: "Deepa V.",
      verifiedPurchase: false,
      isFeatured: false,
      imageUrls: [],
      createdAt: daysAgo(90),
    },
  ],
};

export function getDemoReviewsForProduct(productId: string, productName?: string): EnrichedPublicReview[] {
  return (DEMO_REVIEWS_BY_PRODUCT[productId] ?? DEMO_REVIEWS_BY_PRODUCT.default).map((r) => ({
    ...r,
    productId,
    isSample: true,
    verifiedPurchase: false,
    title: r.title?.replace("product", productName ?? "this product") ?? r.title,
  }));
}

export function mergeReviewsWithDemo(
  productId: string,
  dbReviews: PublicReview[],
  productName?: string,
): EnrichedPublicReview[] {
  if (dbReviews.length > 0) {
    return dbReviews.map((r) => ({ ...r, hasVideo: false }));
  }
  return getDemoReviewsForProduct(productId, productName);
}

export const DEMO_QUESTIONS: ProductQuestion[] = [
  {
    id: "qa-1",
    productId: "default",
    question: "Is this safe to use from day one?",
    category: "safety",
    status: "answered",
    askedBy: "Neha P.",
    createdAt: daysAgo(5),
    helpfulCount: 24,
    answers: [
      {
        id: "ans-1",
        body: "Yes — formulated for delicate newborn skin. Always patch test on a small area first, as we recommend on every product label.",
        authorName: "BeyondBabyCo Care Team",
        authorRole: "brand",
        isPinned: true,
        helpfulCount: 41,
        createdAt: daysAgo(4),
      },
      {
        id: "ans-2",
        body: "We started at two weeks after our pediatrician said it was fine. No issues at all.",
        authorName: "Aditi L.",
        authorRole: "parent",
        isPinned: false,
        helpfulCount: 12,
        createdAt: daysAgo(3),
      },
    ],
  },
  {
    id: "qa-2",
    productId: "default",
    question: "How much should I use per bath?",
    category: "usage",
    status: "answered",
    askedBy: "Vikram S.",
    createdAt: daysAgo(14),
    helpfulCount: 18,
    answers: [
      {
        id: "ans-3",
        body: "A pea-sized amount for newborns, increasing to a dime-sized amount as your baby grows. A little goes a long way.",
        authorName: "BeyondBabyCo Care Team",
        authorRole: "brand",
        isPinned: true,
        helpfulCount: 29,
        createdAt: daysAgo(13),
      },
    ],
  },
  {
    id: "qa-3",
    productId: "default",
    question: "Does this contain parabens or sulphates?",
    category: "ingredients",
    status: "answered",
    askedBy: "Ritu G.",
    createdAt: daysAgo(20),
    helpfulCount: 31,
    answers: [
      {
        id: "ans-4",
        body: "No parabens, sulphates, or artificial dyes. See the full INCI list on the Ingredients tab.",
        authorName: "BeyondBabyCo Care Team",
        authorRole: "brand",
        isPinned: true,
        helpfulCount: 36,
        createdAt: daysAgo(19),
      },
    ],
  },
  {
    id: "qa-4",
    productId: "default",
    question: "Can I use this with eczema-prone skin?",
    category: "safety",
    status: "pending",
    askedBy: "Megha T.",
    createdAt: daysAgo(2),
    helpfulCount: 6,
    answers: [],
  },
  {
    id: "qa-5",
    productId: "default",
    question: "How long does delivery usually take?",
    category: "shipping",
    status: "answered",
    askedBy: "Arjun N.",
    createdAt: daysAgo(30),
    helpfulCount: 9,
    answers: [
      {
        id: "ans-5",
        body: "Metro cities typically receive orders in 2–4 business days. See our shipping policy for full details.",
        authorName: "BeyondBabyCo Care Team",
        authorRole: "brand",
        isPinned: false,
        helpfulCount: 11,
        createdAt: daysAgo(29),
      },
    ],
  },
];

export function getDemoQuestionsForProduct(productId: string): ProductQuestion[] {
  return DEMO_QUESTIONS.map((q) => ({ ...q, productId }));
}

export const DEMO_GALLERY_ITEMS: GalleryMediaItem[] = [
  {
    id: "gal-1",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png",
    caption: "Calm evening bath routine",
    productName: "Gentle Baby Wash",
    productSlug: "calendula-gentle-baby-wash",
    customerName: "Priya M.",
  },
  {
    id: "gal-2",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-08.png",
    caption: "Nursery shelfie with our favourites",
    productName: "Nourishing Baby Oil",
    productSlug: "coconut-nourishing-baby-oil",
    customerName: "Rahul & Meera S.",
  },
  {
    id: "gal-3",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-04.png",
    caption: "Post-bath cuddles",
    customerName: "Rahul & Meera S.",
  },
  {
    id: "gal-4",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-10.png",
    caption: "Perfect baby shower gift",
    customerName: "Kavita R.",
  },
  {
    id: "gal-5",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-04.png",
    caption: "Morning skincare routine",
    customerName: "Ananya K.",
  },
  {
    id: "gal-6",
    type: "photo",
    url: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-15.png",
    caption: "Weekend park day essentials",
    productName: "Daily Moisture Lotion",
    productSlug: "shea-butter-baby-lotion",
    customerName: "Deepa V.",
  },
];

export const COMMUNITY_HIGHLIGHTS: CommunityHighlightItem[] = [
  {
    id: "ch-1",
    title: "Research-backed formulas",
    description: "Every product is developed with pediatric and dermatology advisors before launch.",
    href: "/research",
    icon: "🧪",
  },
  {
    id: "ch-2",
    title: "Verified reviews",
    description: "Ratings and reviews come from real customers after verified purchases.",
    href: "/reviews/gallery",
    icon: "⭐",
  },
  {
    id: "ch-3",
    title: "Dermatologist reviewed",
    description: "Ingredient lists are screened for delicate newborn and toddler skin.",
    stat: "100%",
    href: "/trust-center",
    icon: "🩺",
  },
];

export const PARENT_STORIES: CommunityStory[] = [
  {
    id: "story-1",
    title: "Our eczema journey got easier",
    excerpt:
      "After months of trial and error, we found a routine that keeps flare-ups calm — simpler ingredients made the difference.",
    author: "Meera S., Bengaluru",
    imageUrl: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-08.png",
    href: "/community#stories",
  },
  {
    id: "story-2",
    title: "Twin parents, double the bottles",
    excerpt:
      "We reorder every month. Bath time is faster when you trust what goes on their skin.",
    author: "Arjun & Neha, Pune",
    imageUrl: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png",
    href: "/community#stories",
  },
  {
    id: "story-3",
    title: "Grandma-approved gentle care",
    excerpt:
      "My mother-in-law was skeptical until she felt how light the lotion is. Now she gifts it to every new parent in the family.",
    author: "Kavita R., Mumbai",
    imageUrl: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-10.png",
    href: "/community#stories",
  },
];

export const CARE_TIPS: CareTip[] = [
  {
    id: "tip-1",
    title: "Patch test first",
    body: "Apply a small amount on the inner arm and wait 24 hours before full use on newborns.",
    icon: "🧪",
  },
  {
    id: "tip-2",
    title: "Less is more",
    body: "A pea-sized amount is enough for most daily applications — over-applying won't increase benefits.",
    icon: "💧",
  },
  {
    id: "tip-3",
    title: "Store away from sunlight",
    body: "Keep products in a cool, dry place to preserve active botanical ingredients.",
    icon: "🌤️",
  },
  {
    id: "tip-4",
    title: "Routine beats reactiveness",
    body: "Consistent gentle care prevents dryness better than treating flare-ups after they appear.",
    icon: "📅",
  },
];

export const FAQ_PINNED = [
  {
    question: "Are BeyondBabyCo products tested on babies?",
    answer:
      "Every product undergoes dermatological safety testing and ingredient screening before launch. We never compromise on safety standards.",
  },
  {
    question: "How do verified purchase reviews work?",
    answer:
      "Reviews marked Verified Purchase come from customers who bought the product through BeyondBabyCo. This badge will connect to order data as the review system fully rolls out.",
  },
];

export { DEMO_PRODUCT_IDS };
