import { CONTENT_IMAGES, TRUST_BADGES } from "@/lib/content/images";
import { brandSupportEmail, brandSupportMailto } from "@/lib/brand/contact";
import type { ContentPage } from "@/lib/content/types";

export const aboutPage: ContentPage = {
  slug: "about",
  title: "About Us",
  description:
    "BeyondBabyCo is a research-led baby care brand from Udaipur, India — created by parents who believe every baby deserves the safest touch.",
  eyebrow: "Our Company",
  heroImage: CONTENT_IMAGES.about,
  jsonLd: "article",
  relatedLinks: [
    { label: "Our Story", href: "/our-story" },
    { label: "Trust Center", href: "/trust-center" },
    { label: "Research", href: "/research" },
    { label: "Contact", href: "/contact" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "BeyondBabyCo is a baby care brand born from five years of research in Udaipur, Rajasthan. Operated by Tusawda Global Private Limited, we create gentle, dermatologically tested products for Indian families — because parents deserve complete confidence in what touches their baby's skin.",
        "We do not rush products to market. Every BeyondBabyCo formulation begins with ingredient research, safety validation, and quality testing — because your baby's skin deserves nothing less than our best work.",
      ],
    },
    {
      type: "stats",
      items: [
        { value: "5 Years", label: "Of research" },
        { value: "2021", label: "Research began" },
        { value: "Made in", label: "Udaipur, India 🇮🇳" },
        { value: "100%", label: "Dermatologically tested" },
      ],
    },
    {
      type: "cards",
      title: "What guides us",
      description: "Three principles shape every decision we make — from ingredient selection to packaging.",
      items: [
        {
          icon: "beaker",
          title: "Research First",
          description:
            "We study baby skin science and ingredient safety before a single formula is written.",
          href: "/research",
        },
        {
          icon: "shield",
          title: "Safety Always",
          description:
            "Every product undergoes dermatological testing and strict quality checks.",
          href: "/safety-standards",
        },
        {
          icon: "heart",
          title: "Made with Love",
          description:
            "Created by parents who understand the trust you place in every wipe, wash, and lotion.",
          href: "/our-story",
        },
      ],
    },
    {
      type: "imageSplit",
      title: "Rooted in Rajasthan, made for every Indian family",
      paragraphs: [
        "Our team operates from Udaipur, where we combine local manufacturing expertise with global quality standards. We source ingredients thoughtfully, partner with certified facilities, and maintain full traceability from raw material to finished product.",
        "BeyondBabyCo is more than a brand — it is a promise to parents across India that gentle, effective baby care can be both accessible and trustworthy.",
      ],
      image: CONTENT_IMAGES.family,
      imageAlt: "BeyondBabyCo family-focused baby care lifestyle",
    },
    {
      type: "cta",
      title: "Discover our research journey",
      description: "See how five years of science became products families can trust.",
      primary: { label: "Trust Center", href: "/trust-center" },
      secondary: { label: "Shop Products", href: "/products" },
    },
    { type: "sustainability" },
  ],
};

export const ourStoryPage: ContentPage = {
  slug: "our-story",
  title: "Our Story",
  description:
    "From a parent's question to a research-led baby care brand — discover how BeyondBabyCo was born in Udaipur, India.",
  eyebrow: "The Beginning",
  heroImage: CONTENT_IMAGES.story,
  jsonLd: "article",
  relatedLinks: [
    { label: "About Us", href: "/about" },
    { label: "Research", href: "/research" },
    { label: "Why BeyondBabyCo", href: "/why-beyondbabyco" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "BeyondBabyCo started with a question every new parent asks: \"Is this truly safe for my baby?\" Frustrated by vague claims and unclear ingredient lists, our founders — parents themselves — set out to build a brand where transparency and science come first.",
        "What began as late-night research into baby skin biology grew into a five-year journey of formulation, testing, and refinement. Today, BeyondBabyCo represents that journey — research transformed into gentle products you can trust.",
      ],
    },
    {
      type: "timeline",
      title: "How we got here",
      description: "Every milestone brought us closer to launch — and closer to earning your trust.",
      items: [
        {
          year: "2021",
          title: "The question that started it all",
          description:
            "Our founders began studying infant skin barrier function and common irritants in commercial baby products.",
        },
        {
          year: "2022",
          title: "Ingredient deep-dive",
          description:
            "Hundreds of ingredient combinations were evaluated for safety, efficacy, and suitability for delicate skin.",
        },
        {
          year: "2023",
          title: "First formulations",
          description:
            "Core product formulas were developed with a focus on purity, gentleness, and minimal ingredient lists.",
        },
        {
          year: "2024",
          title: "Safety validation",
          description:
            "Stability testing, dermatological panels, and quality assurance protocols were completed.",
        },
        {
          year: "2025",
          title: "Manufacturing readiness",
          description:
            "GMP-certified production partnerships and supply chain systems were established.",
        },
        {
          year: "2026",
          title: "BeyondBabyCo launches",
          description:
            "Research years in the making become products available to families across India.",
        },
      ],
    },
    {
      type: "imageSplit",
      title: "Built by parents, for parents",
      paragraphs: [
        "We know the feeling of reading every label twice. We know the worry that comes with trying something new on sensitive skin. That is why every BeyondBabyCo product is designed the way we would want it for our own children — gentle, transparent, and backed by real research.",
        "Our mascot family — Bella Bunny, Gigi Giraffe, Poppy Panda, and friends — represents the joy and care at the heart of everything we create.",
      ],
      image: CONTENT_IMAGES.story,
      imageAlt: "BeyondBabyCo brand story and family values",
      reverse: true,
    },
    {
      type: "cta",
      title: "Join us on this journey",
      description: "Be among the first families to experience research-backed baby care.",
      primary: { label: "Shop Now", href: "/products" },
      secondary: { label: "Contact Us", href: "/contact" },
    },
  ],
};

export const whyBeyondBabyCoPage: ContentPage = {
  slug: "why-beyondbabyco",
  title: "Why BeyondBabyCo",
  description:
    "Discover what sets BeyondBabyCo apart — research-first formulations, transparent ingredients, dermatological testing, and Made-in-India quality.",
  eyebrow: "Our Difference",
  heroImage: CONTENT_IMAGES.why,
  jsonLd: "article",
  relatedLinks: [
    { label: "Ingredients", href: "/ingredients" },
    { label: "Safety Standards", href: "/safety-standards" },
    { label: "Certifications", href: "/certifications" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "The baby care aisle is full of promises. BeyondBabyCo is built on proof. We combine five years of ingredient research, dermatological testing, and parent-focused design to create products that earn — not just claim — your trust.",
      ],
    },
    {
      type: "cards",
      title: "Six reasons parents choose us",
      columns: 3,
      items: [
        {
          icon: "beaker",
          title: "Research-Backed",
          description: "Every formula starts in the lab, not the marketing room.",
          href: "/research",
        },
        {
          icon: "leaf",
          title: "Clean Ingredients",
          description: "Free from parabens, sulfates, and harsh chemicals.",
          href: "/ingredients",
        },
        {
          icon: "shield",
          title: "Dermatologically Tested",
          description: "Independently tested for safety on sensitive skin.",
          href: "/safety-standards",
        },
        {
          icon: "sparkles",
          title: "Transparent Labels",
          description: "Full ingredient disclosure on every product page.",
          href: "/ingredients",
        },
        {
          icon: "heart",
          title: "Parent-Designed",
          description: "Created by parents who understand your concerns.",
          href: "/our-story",
        },
        {
          icon: "flask",
          title: "Made in India",
          description: "Proudly manufactured with global quality standards.",
          href: "/manufacturing",
        },
      ],
    },
    {
      type: "trustBadges",
      title: "Trust you can see",
      description: "Our commitment to quality is reflected in every certification and test.",
      badges: [
        {
          image: TRUST_BADGES.dermatologicallyTested,
          title: "Dermatologically Tested",
          imageAlt: "Dermatologically tested badge",
        },
        {
          image: TRUST_BADGES.parabenFree,
          title: "Paraben Free",
          imageAlt: "Paraben free badge",
        },
        {
          image: TRUST_BADGES.sulfateFree,
          title: "Sulfate Free",
          imageAlt: "Sulfate free badge",
        },
        {
          image: TRUST_BADGES.crueltyFree,
          title: "Cruelty Free",
          imageAlt: "Cruelty free badge",
        },
        {
          image: TRUST_BADGES.madeInIndia,
          title: "Made in India",
          imageAlt: "Made in India badge",
        },
      ],
    },
    {
      type: "cta",
      title: "Experience the difference",
      description: "Browse our research-backed baby care essentials.",
      primary: { label: "Shop Products", href: "/products" },
      secondary: { label: "Read FAQs", href: "/faq" },
    },
  ],
};

export const careersPage: ContentPage = {
  slug: "careers",
  title: "Careers",
  description:
    "Join the BeyondBabyCo team in Udaipur. We are building a research-led baby care brand and looking for passionate people in product, science, and operations.",
  eyebrow: "Work With Us",
  heroImage: CONTENT_IMAGES.careers,
  jsonLd: "article",
  relatedLinks: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Press", href: "/press" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "BeyondBabyCo is growing — and we are looking for people who care deeply about quality, transparency, and the families we serve. Based in Udaipur, Rajasthan, our team blends research rigour with creative passion.",
        "We value curiosity, integrity, and a genuine desire to make baby care better for every Indian family.",
      ],
    },
    {
      type: "cards",
      title: "What we look for",
      columns: 2,
      items: [
        {
          icon: "beaker",
          title: "Science & Formulation",
          description: "Cosmetic chemists, microbiologists, and quality analysts who love precision.",
        },
        {
          icon: "heart",
          title: "Brand & Content",
          description: "Storytellers and designers who can translate research into parent-friendly communication.",
        },
        {
          icon: "shield",
          title: "Operations & Quality",
          description: "Supply chain, manufacturing, and compliance professionals with GMP experience.",
        },
        {
          icon: "sparkles",
          title: "Customer Experience",
          description: "Support specialists who treat every parent inquiry with empathy and care.",
        },
      ],
    },
    {
      type: "intro",
      title: "Open positions",
      paragraphs: [
        "We are preparing to hire across product development, quality assurance, and customer support as we scale toward our 2026 launch. Specific role listings will be posted here as they become available.",
        "If you believe in our mission and want to be part of the journey from the start, we would love to hear from you.",
      ],
    },
    {
      type: "cta",
      title: "Interested in joining us?",
      description: "Send your resume and a brief note about why BeyondBabyCo resonates with you.",
      primary: { label: "Email Careers", href: brandSupportMailto("Careers at BeyondBabyCo") },
      secondary: { label: "About Us", href: "/about" },
    },
  ],
};

export const pressPage: ContentPage = {
  slug: "press",
  title: "Press",
  description:
    "Press resources, brand information, and media contact for BeyondBabyCo — India's research-led baby care brand.",
  eyebrow: "Media Centre",
  heroImage: CONTENT_IMAGES.press,
  jsonLd: "article",
  relatedLinks: [
    { label: "About Us", href: "/about" },
    { label: "Our Story", href: "/our-story" },
    { label: "Contact", href: "/contact" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "BeyondBabyCo is a research-led baby care brand from Udaipur, India, operated by Tusawda Global Private Limited. We are preparing for our 2026 launch with a portfolio focused on gentle, dermatologically tested products for Indian families.",
        "For press enquiries, interview requests, or brand assets, please contact our media team.",
      ],
    },
    {
      type: "cards",
      title: "Brand at a glance",
      columns: 2,
      items: [
        {
          title: "Company",
          description: "Tusawda Global Private Limited, Udaipur, Rajasthan, India",
        },
        {
          title: "Founded",
          description: "Research began 2021; brand launch planned 2026",
        },
        {
          title: "Category",
          description: "Baby wipes, bath & skin care, newborn essentials",
        },
        {
          title: "Differentiator",
          description: "Research-first formulations with full ingredient transparency",
        },
      ],
    },
    {
      type: "intro",
      title: "Media contact",
      paragraphs: [
        `Email: ${brandSupportEmail()}`,
        "Subject line: Press Enquiry — [Your Publication]",
        "We aim to respond to all media requests within two business days.",
        "Follow us on Instagram @beyondbabyco for brand updates and launch announcements.",
      ],
    },
    {
      type: "cta",
      title: "Request brand assets",
      description: "Logo files, product imagery, and founder bios available on request.",
      primary: { label: "Contact Media Team", href: brandSupportMailto("Press Assets Request") },
      secondary: { label: "About Us", href: "/about" },
    },
  ],
};
