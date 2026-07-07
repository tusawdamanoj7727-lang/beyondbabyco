import { BRAND_LOGO_PATH } from "@/lib/brand/logo";
import { absoluteUrl, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl(BRAND_LOGO_PATH),
    description: SITE_DESCRIPTION,
    sameAs: ["https://instagram.com/beyondbabyco"],
    foundingDate: "2021",
    areaServed: "IN",
    knowsAbout: [
      "Baby care products",
      "Dermatologically tested formulations",
      "Research-backed infant skin care",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "BeyondBabyCo Products",
      url: absoluteUrl("/products"),
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? absoluteUrl(item.url) : undefined,
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string | null;
  shortDescription?: string | null;
  slug: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  brandName?: string | null;
}) {
  const description = product.description ?? product.shortDescription ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: product.brandName?.trim() || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(article: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: absoluteUrl(article.path),
    datePublished: article.datePublished ?? "2026-01-01",
    dateModified: article.dateModified ?? "2026-07-01",
    author: { "@type": "Organization", name: SITE_NAME, url: getSiteUrl() },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl(BRAND_LOGO_PATH) },
    },
  };
}

export function reviewJsonLd(reviews: { author: string; rating: number; body: string; date: string }[]) {
  if (reviews.length === 0) return null;
  return reviews.slice(0, 5).map((r) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    reviewRating: { "@type": "Rating", ratingValue: r.rating },
    reviewBody: r.body,
    datePublished: r.date,
  }));
}
