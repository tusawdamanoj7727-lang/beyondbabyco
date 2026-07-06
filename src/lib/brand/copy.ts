/**
 * Phase 11.2 — Premium editorial copy & microcopy.
 * Single brand voice: warm, honest, calm, research-led, modern, Indian.
 * No superlatives, no medical claims, no AI clichés.
 */

export const BRAND = {
  name: "BeyondBabyCo",
  tagline: "Gentle care, backed by science.",
  siteTitle: "BeyondBabyCo — Gentle Care, Backed by Science",
  parentCompany: "Tusawda Global Private Limited",
  location: "Udaipur, Rajasthan, India",
} as const;

/** Editorial voice guide (for docs & CMS reference) */
export const BRAND_VOICE = {
  personality: ["Warm", "Honest", "Premium", "Scientific", "Calm", "Modern", "Indian", "Trustworthy"],
  weSoundLike: "A thoughtful parent who happens to be a formulation scientist — never a billboard.",
  weAvoid: [
    "100% safe",
    "best",
    "#1",
    "chemical-free",
    "perfect",
    "game-changer",
    "revolutionary",
    "unlock",
    "elevate your",
    "designed to delight",
  ],
  wePrefer: [
    "Thoughtfully crafted",
    "Developed through research",
    "Gentle on delicate skin",
    "Made with care in India",
    "Created with parents in mind",
  ],
} as const;

export const HERO = {
  badge: "Created with parents • Refined through research",
  headline: "Gentle care.\nBacked by science.",
  subcopy:
    "Thoughtfully developed for everyday baby care using carefully selected ingredients and research-led formulations.",
  primaryCta: "Explore Collection",
  secondaryCta: "Our Research",
  imageAlt: "A calm moment between parent and baby — BeyondBabyCo",
  trustBadges: [
    { label: "Dermatologically tested", slug: "dermatologically-tested" },
    { label: "Made in India", slug: "made-in-india" },
    { label: "Mindfully selected ingredients", slug: "natural-ingredients" },
  ],
} as const;

export const TICKER_ITEMS = [
  "Dermatologically Tested",
  "Made in India",
  "5 Years of R&D",
  "Free Shipping on ₹999+",
  "Paraben Free",
  "Hypoallergenic",
  "Cruelty Free",
  "Safe for Newborns",
] as const;

export const TRUST_STATS = [
  { value: "2021", label: "Research began" },
  { value: "Tested", label: "Dermatologically" },
  { value: "2026", label: "First launches" },
  { value: "India", label: "Made with care 🇮🇳" },
] as const;

export const BRAND_PROMISE = {
  eyebrow: "Our foundation",
  heading: "Every formula begins\nwith intention",
  description:
    "We do not rush to shelves. Each BeyondBabyCo product starts with ingredient research, gentle formulation, and the kind of testing we would want for our own families.",
  cards: [
    {
      title: "Research",
      description:
        "Ingredients are chosen for purpose — not trend. We study, refine, and document before anything reaches your nursery.",
    },
    {
      title: "Safety",
      description:
        "Dermatological testing and stability checks are part of our process — because delicate skin deserves a careful approach.",
    },
    {
      title: "Care",
      description:
        "Designed by people who understand the small rituals of parenthood — the wipes, the baths, the quiet moments in between.",
    },
  ],
} as const;

export const SCIENCE_SECTION = {
  eyebrow: "The science",
  heading: "Mindful ingredients.\nRigorous research.",
  description:
    "Our formulations bring together carefully selected ingredients and years of development work — tested for compatibility with sensitive, developing skin.",
  features: [
    {
      title: "Research-led",
      description: "Every ingredient earns its place through formulation study — not marketing copy.",
    },
    {
      title: "Dermatologically tested",
      description: "External testing helps us understand how formulas behave on delicate skin.",
    },
    {
      title: "Parent-informed",
      description: "Real feedback from Indian families shapes texture, scent, and everyday usability.",
    },
  ],
  stat: { value: "5 Years", label: "Of formulation work" },
} as const;

export const LIFESTYLE_SECTION = {
  eyebrow: "Daily rituals",
  heading: "The quiet moments\nmatter most",
  description:
    "From the first wipe to bedtime bath — our products are made to feel calm, considered, and easy to reach for throughout the day.",
  features: [
    {
      title: "Gentle textures",
      description: "Soft, thoughtful formulas that feel right in everyday routines.",
    },
    {
      title: "Honest safety",
      description: "Clear ingredient lists and testing you can read about — not just trust blindly.",
    },
    {
      title: "Everyday ease",
      description: "Designed for real nurseries, real diaper bags, and real mornings.",
    },
  ],
} as const;

export const RESEARCH_TIMELINE = {
  eyebrow: "Our journey",
  heading: "Five years before\nour first launch",
  intro: "We chose patience over pace — because baby care is not something you hurry.",
  entries: [
    {
      year: "2021",
      title: "It started with a question",
      description:
        "We began studying baby skin, ingredient safety, and what Indian parents wished existed on shelf.",
    },
    {
      year: "2022",
      title: "Ingredient exploration",
      description:
        "Hundreds of combinations were evaluated for gentleness, stability, and suitability for daily use.",
    },
    {
      year: "2023",
      title: "Formula refinement",
      description:
        "Textures, concentrations, and preservation systems were refined through iterative development.",
    },
    {
      year: "2024",
      title: "Validation & testing",
      description:
        "Stability, quality, and dermatological testing helped us understand how formulas perform over time.",
    },
    {
      year: "2025",
      title: "Production readiness",
      description:
        "Manufacturing partners, quality systems, and batch consistency were prepared for launch.",
    },
    {
      year: "2026",
      title: "BeyondBabyCo arrives",
      description:
        "Research becomes products — starting with Baby Wipes, with the full collection following through the year.",
    },
  ],
} as const;

export const FEATURED_PRODUCTS = {
  eyebrow: "Launch collection",
  heading: "Featured Collection",
  intro:
    "Baby Wipes are available now. Seven more formulas have completed development and arrive through 2026 — each one ready when it meets our standards.",
  viewProduct: "View details",
  notifyMe: "Notify me at launch",
} as const;

export const CATEGORIES = {
  eyebrow: "Shop by care",
  heading: "Care for every stage",
  intro:
    "From the first days through toddlerhood — explore what is available now and what is coming next.",
} as const;

export const TESTIMONIALS = {
  eyebrow: "From families",
  heading: "Voices from\nour community",
  intro: "Verified reviews from parents will appear here as families share their experience.",
  items: [] as { name: string; city: string; rating: number; text: string }[],
} as const;

export const NEWSLETTER = {
  eyebrow: "Stay in touch",
  heading: "Quiet updates\nfor growing families",
  description:
    "Launch announcements, ingredient stories, and occasional offers — no clutter, no spam.",
  button: "Join the list",
  placeholder: "Your email address",
  success: "You're on the list. We'll write when there is something worth sharing.",
  emailError: "Please enter a valid email address.",
} as const;

export const MASCOTS = {
  eyebrow: "Meet our friends",
  heading: "Little guides\nfor big moments",
  intro:
    "Our mascot family helps us explain care, research, and play — because learning should feel warm, not clinical.",
} as const;

export const FOOTER = {
  companyInfo:
    "Thoughtfully crafted baby care — developed through research and made with care in India for growing families.",
  supportHours: "Monday–Saturday, 10 AM – 6 PM IST",
  madeWith: "Made with care for every growing family.",
} as const;

/** /products collection page hero — fixed copy (not CMS-driven). */
export const PRODUCTS_PAGE = {
  heroEyebrow: "Research-backed baby care",
  heroTitle: "Shop Gentle Baby Care",
  heroDescription:
    "Dermatologically tested formulas, crafted with 5 years of research for your little one's everyday routine.",
  metaTitle: "Shop Gentle Baby Care",
  metaDescription:
    "Dermatologically tested baby care formulas, crafted with 5 years of research for your little one's everyday routine.",
} as const;

export const MICROCOPY = {
  loading: "Preparing something gentle…",
  searching: "Looking through the collection…",
  addingToCart: "Added to your bag",
  removedFromWishlist: "Removed from your saved items",
  savedToWishlist: "Saved for later",
  products: {
    emptyTitle: "The collection is growing",
    emptyDescription: "Our first products are here — more formulas arrive through 2026.",
    filterEmptyTitle: "We couldn't find a match",
    filterEmptyDescription: "Try adjusting your filters, or browse the full collection.",
    clearFilters: "Reset filters",
    viewAll: "Browse the collection",
    backHome: "Return home",
  },
  search: {
    placeholder: "Search wipes, wash, gifts…",
    noResultsTitle: "Nothing matched that search",
    noResultsDescription: (query: string) =>
      `We couldn't find "${query}" in our collection. Try a different word, or explore everything we offer.`,
    browseAll: "Browse the collection",
    clearSearch: "Start a new search",
    recentLabel: "Recent searches",
  },
  cart: {
    emptyTitle: "Your bag is waiting",
    emptyDescription: "When you find something gentle, it will appear here.",
    shopCta: "Explore the collection",
    pageTitle: "Your bag",
    miniEmpty: "Your bag is empty",
    checkoutEmptyTitle: "Nothing to checkout yet",
    checkoutEmptyDescription: "Add something from the collection, then return here when you're ready.",
  },
  wishlist: {
    emptyTitle: "Your wishlist is empty",
    emptyDescription: "Tap the heart on any product to save it here for later.",
    guestTitle: "Your wishlist is empty",
    guestDescription: "Tap the heart on any product to save it here for later.",
    shopCta: "Browse Products",
    signInCta: "Sign in",
  },
  notFound: {
    title: "This page isn't here",
    description: "The link may have changed, or the page may have moved. Let's get you back to familiar ground.",
    home: "Return home",
    shop: "Browse products",
  },
  pdp: {
    benefitsEmpty: "Benefit highlights will appear here once published.",
    ingredientsEmpty: "Ingredient details will appear here once published.",
    directionsEmpty: "Usage directions will appear here once published.",
    safetyEmpty: "Safety information will appear here once published.",
    storageEmpty: "Storage guidance will appear here once published.",
    faqEmpty: "Questions and answers will appear here once published.",
    relatedEmpty: "Related products will appear here as the collection grows.",
    reviewsSampleNote:
      "Early voices from BeyondBabyCo families — verified purchase reviews appear as orders arrive.",
    qaSampleNote:
      "Answers to questions parents ask most often about gentle, research-backed care.",
  },
  auth: {
    loginTitle: "Welcome back",
    registerTitle: "Join BeyondBabyCo",
    forgotTitle: "Reset your password",
  },
} as const;

export const TRENDING_SEARCHES = [
  "Baby wipes",
  "Diaper cream",
  "Gift sets",
  "Gentle wash",
  "Sensitive skin",
] as const;

/** Static featured product cards (homepage fallback) */
export const FEATURED_PRODUCT_CARDS = [
  {
    id: 1,
    name: "Pure & Gentle Water Baby Wipes",
    category: "Baby Wipes",
    badge: "Available Now",
    description:
      "Soft, fragrance-conscious wipes for everyday changes — our first product to reach families.",
    price: "From ₹299",
    slug: "pure-gentle-water-baby-wipes",
    comingSoon: false,
  },
  {
    id: 2,
    name: "Gentle Baby Wash",
    category: "Bath & skin",
    badge: "Coming 2026",
    description: "A soap-free cleanse developed through years of formulation work.",
    price: "Arriving 2026",
    comingSoon: true,
  },
  {
    id: 3,
    name: "Shea Butter Baby Lotion",
    category: "Skin care",
    badge: "Coming 2026",
    description: "Light, nourishing moisture with skin-loving ingredients.",
    price: "Arriving 2026",
    comingSoon: true,
  },
  {
    id: 4,
    name: "Ayurvedic Baby Oil",
    category: "Massage & care",
    badge: "Available Now",
    description: "A calming massage oil inspired by gentle Indian care traditions.",
    price: "From ₹499",
    slug: "ayurvedic-massage-oil",
    comingSoon: false,
  },
  {
    id: 5,
    name: "Talc-Free Baby Powder",
    category: "Daily care",
    badge: "Coming 2026",
    description: "A light, talc-free powder for comfortable daily use.",
    price: "Arriving 2026",
    comingSoon: true,
  },
  {
    id: 6,
    name: "2-in-1 Baby Shampoo",
    category: "Hair & bath",
    badge: "Coming 2026",
    description: "One gentle formula for hair and body — development complete.",
    price: "Arriving 2026",
    comingSoon: true,
  },
  {
    id: 7,
    name: "Premium Gift Box",
    category: "Gift sets",
    badge: "Coming 2026",
    description: "Curated essentials for gifting — launching with the full collection.",
    price: "Arriving 2026",
    comingSoon: true,
  },
  {
    id: 8,
    name: "Newborn Essentials Kit",
    category: "Newborn",
    badge: "Coming 2026",
    description: "Thoughtfully assembled newborn care — notify us to hear first.",
    price: "Arriving 2026",
    comingSoon: true,
  },
] as const;

export const CATEGORY_ITEMS = [
  { title: "Baby Wipes", count: "Available now" },
  { title: "Baby Wash", count: "Arriving 2026" },
  { title: "Baby Lotion", count: "Arriving 2026" },
  { title: "Baby Oil", count: "Arriving 2026" },
  { title: "Baby Powder", count: "Arriving 2026" },
  { title: "Gift Sets", count: "Arriving 2026" },
  { title: "Newborn Essentials", count: "Arriving 2026" },
  { title: "Bath Time", count: "Development complete" },
] as const;
