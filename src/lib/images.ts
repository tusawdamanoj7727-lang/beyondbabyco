// All real images for the website — change these URLs anytime
export const IMAGES = {
  // ── HERO ──
  hero: {
    main: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1920&q=90",
    // Indian mother holding baby — warm, natural light
    mother_baby: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1200&q=85",
    bath_time: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=85",
  },

  // ── PRODUCTS ──
  products: {
    baby_wipes: "/images/generated/products/baby-wipes/front.webp", // real photo exists
    baby_lotion: "https://images.unsplash.com/photo-1556228578-626d52e9793d?w=800&q=85",
    baby_wash: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=85",
    baby_oil: "https://images.unsplash.com/photo-1590736969596-701ad36ce65d?w=800&q=85",
    baby_shampoo: "https://images.unsplash.com/photo-1556228578-626d52e9793d?w=800&q=85",
    baby_cream: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=85",
    gift_set: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=85",
    massage_oil: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=85",
    placeholder: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80",
  },

  // ── LIFESTYLE ──
  lifestyle: {
    bath_routine: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=85",
    massage_time: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&q=85",
    play_time: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=85",
    sleep_time: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=85",
    feeding_time: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=85",
    outdoor: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=85",
  },

  // ── SCIENCE / RESEARCH ──
  research: {
    lab: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=85",
    ingredients: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=85",
    testing: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=85",
    certificate: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=85",
    botanicals: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=85",
  },

  // ── CATEGORIES ──
  categories: {
    skin_care: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80",
    hair_care: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    bath_body: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80",
    massage: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=80",
    gift_sets: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    wellness: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  },

  // ── OG / SOCIAL ──
  og: {
    home: "/images/og/og-home.jpg",
    products: "/images/og/og-products.jpg",
    default: "/images/og/og-home.jpg",
  },
} as const;

/** Product slug → hero image (Unsplash or approved real asset). */
export const PRODUCT_IMAGES_BY_SLUG: Record<string, string> = {
  "pure-gentle-water-baby-wipes": IMAGES.products.baby_wipes,
  "ayurvedic-massage-oil": IMAGES.products.massage_oil,
  "shea-butter-baby-lotion": IMAGES.products.baby_lotion,
  "shea-butter-lotion": IMAGES.products.baby_lotion,
  "calendula-baby-wash": IMAGES.products.baby_wash,
  "gift-set": IMAGES.products.gift_set,
  "newborn-essentials-gift-set": IMAGES.products.gift_set,
  "gift-sets": IMAGES.products.gift_set,
};

/** Homepage category title → editorial card image. */
export const CATEGORY_IMAGES_BY_TITLE: Record<string, string> = {
  "Baby Wipes": IMAGES.categories.bath_body,
  "Baby Wash": IMAGES.categories.bath_body,
  "Baby Lotion": IMAGES.categories.skin_care,
  "Baby Oil": IMAGES.categories.massage,
  "Baby Powder": IMAGES.categories.skin_care,
  "Gift Sets": IMAGES.categories.gift_sets,
  "Newborn Essentials": IMAGES.categories.wellness,
  "Bath Time": IMAGES.categories.bath_body,
};
