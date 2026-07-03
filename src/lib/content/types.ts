export type ContentLink = {
  label: string;
  href: string;
};

export type ContentCard = {
  icon?: string;
  image?: string;
  imageAlt?: string;
  title: string;
  description?: string;
  href?: string;
};

export type ContentTimelineItem = {
  year: string;
  title: string;
  description: string;
};

export type ContentFaqItem = {
  question: string;
  answer: string;
  category?: string;
};

export type ContentLegalSection = {
  title: string;
  paragraphs: string[];
};

export type ContentStat = {
  value: string;
  label: string;
};

export type ContentSection =
  | { type: "intro"; title?: string; paragraphs: string[] }
  | { type: "cards"; title?: string; description?: string; items: ContentCard[]; columns?: 2 | 3 | 4 }
  | { type: "imageSplit"; title: string; paragraphs: string[]; image: string; imageAlt: string; reverse?: boolean }
  | { type: "timeline"; title?: string; description?: string; items: ContentTimelineItem[] }
  | { type: "trustBadges"; title?: string; description?: string; badges: ContentCard[] }
  | { type: "stats"; items: ContentStat[] }
  | { type: "faq"; title?: string; items: ContentFaqItem[] }
  | { type: "legal"; lastUpdated: string; sections: ContentLegalSection[] }
  | { type: "contact" }
  | { type: "cta"; title: string; description: string; primary: ContentLink; secondary?: ContentLink }
  | { type: "researchProcess"; compact?: boolean }
  | { type: "ingredientTransparency"; limit?: number }
  | { type: "qualityStandards"; compact?: boolean }
  | { type: "doctorAdvisory"; compact?: boolean }
  | { type: "manufacturingStory" }
  | { type: "sustainability" }
  | { type: "trustWidgets"; variant?: "strip" | "grid" };

export type ContentPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  heroImage?: string;
  sections: ContentSection[];
  relatedLinks?: ContentLink[];
  jsonLd?: "faq" | "article";
};
