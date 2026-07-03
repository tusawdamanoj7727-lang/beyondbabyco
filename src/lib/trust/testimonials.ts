import { testimonialPortrait } from "@/lib/brand/generated-assets";

export type TestimonialCategory = "parent" | "mother" | "father" | "doctor";

export type TrustTestimonial = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  category: TestimonialCategory;
  role?: string;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
  verifiedPurchase?: boolean;
  featured?: boolean;
  date?: string;
  productUsed?: string;
  babyAge?: string;
};

function portrait(index: number) {
  return testimonialPortrait(index).url;
}

export const TRUST_TESTIMONIALS: TrustTestimonial[] = [
  {
    id: "t1",
    name: "Priya Sharma",
    city: "Jaipur",
    rating: 5,
    text: "The wipes feel incredibly soft and gentle. My baby's skin has never been happier. I finally feel confident about what I'm using every day.",
    category: "mother",
    role: "Mother of 8-month-old",
    avatarUrl: portrait(0),
    verifiedPurchase: false,
    featured: true,
    date: "2026-03-15",
    productUsed: "99% Pure Water Baby Wipes",
    babyAge: "8 months",
  },
  {
    id: "t2",
    name: "Ananya Patel",
    city: "Ahmedabad",
    rating: 5,
    text: "Finally a brand that focuses on research before selling products. It gives us confidence that someone actually thought about our baby's skin.",
    category: "mother",
    role: "Mother of newborn",
    avatarUrl: portrait(1),
    verifiedPurchase: false,
    date: "2026-04-02",
    productUsed: "Baby Wipes",
    babyAge: "Newborn",
  },
  {
    id: "t3",
    name: "Neha Verma",
    city: "Delhi",
    rating: 5,
    text: "The quality feels premium and the ingredients are exactly what parents look for. Transparent labelling makes all the difference.",
    category: "parent",
    role: "Parent of twins",
    avatarUrl: portrait(2),
    verifiedPurchase: false,
    date: "2026-04-18",
  },
  {
    id: "t4",
    name: "Rahul Mehta",
    city: "Mumbai",
    rating: 5,
    text: "As a father, I appreciate knowing exactly what's in the products we use. BeyondBabyCo makes it easy to understand and trust.",
    category: "father",
    role: "Father of 1-year-old",
    avatarUrl: portrait(3),
    verifiedPurchase: false,
    date: "2026-05-01",
  },
  {
    id: "t5",
    name: "Dr. Kavita Nair",
    city: "Bangalore",
    rating: 5,
    text: "I appreciate brands that invest in dermatological testing and ingredient transparency. Parents deserve products developed with this level of care.",
    category: "doctor",
    role: "Pediatric Health Consultant",
    avatarUrl: portrait(4),
    date: "2026-05-10",
  },
  {
    id: "t6",
    name: "Sneha Reddy",
    city: "Hyderabad",
    rating: 5,
    text: "We switched to BeyondBabyCo after reading about their research process. The difference in gentleness is noticeable from the first use.",
    category: "mother",
    role: "Mother of 6-month-old",
    avatarUrl: portrait(5),
    verifiedPurchase: false,
    date: "2026-05-22",
  },
  {
    id: "t7",
    name: "Arjun Singh",
    city: "Udaipur",
    rating: 5,
    text: "Fast delivery, genuine products, and a support team that actually responds. This is how baby care brands should operate.",
    category: "father",
    role: "Father of 3-month-old",
    avatarUrl: portrait(6),
    verifiedPurchase: false,
    date: "2026-06-05",
  },
  {
    id: "t8",
    name: "Dr. Meera Joshi",
    city: "Pune",
    rating: 5,
    text: "Formulations that prioritise minimal ingredients and safety testing align with what I recommend to parents looking for gentle daily care options.",
    category: "doctor",
    role: "Dermatology Advisor",
    avatarUrl: portrait(7),
    date: "2026-06-12",
  },
];

export function computeAverageRating(testimonials: TrustTestimonial[]): number {
  if (testimonials.length === 0) return 0;
  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return Math.round((sum / testimonials.length) * 10) / 10;
}

export function getFeaturedTestimonial(testimonials: TrustTestimonial[]): TrustTestimonial | undefined {
  return testimonials.find((t) => t.featured) ?? testimonials[0];
}

export function mapStorefrontTestimonials(
  items: { name: string; city: string; rating: number; text: string; avatarUrl?: string | null }[],
): TrustTestimonial[] {
  return items.map((t, i) => ({
    id: `cms-${i}`,
    name: t.name,
    city: t.city,
    rating: t.rating,
    text: t.text,
    category: "parent" as const,
    avatarUrl: t.avatarUrl ?? portrait(i),
    verifiedPurchase: false,
  }));
}

export function mergeTestimonials(
  cmsItems: { name: string; city: string; rating: number; text: string; avatarUrl?: string | null }[],
): TrustTestimonial[] {
  const cms = mapStorefrontTestimonials(cmsItems);
  if (cms.length >= 3) return cms;
  const cmsIds = new Set(cms.map((t) => t.name));
  const staticFill = TRUST_TESTIMONIALS.filter((t) => !cmsIds.has(t.name));
  return [...cms, ...staticFill].slice(0, 8);
}
