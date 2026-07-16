"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import WriteReviewCta from "@/components/trust/WriteReviewCta";
import {
  computeAverageRating,
  getFeaturedTestimonial,
  mergeTestimonials,
  type TrustTestimonial,
  type TestimonialCategory,
} from "@/lib/trust";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { focusRing, homepageGridGap } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontTestimonial } from "@/lib/homepage/storefront";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";

const CATEGORY_LABELS: Record<TestimonialCategory, string> = {
  parent: "Parent Stories",
  mother: "Mother Stories",
  father: "Father Stories",
  doctor: "Expert Perspectives",
};

const ALL_TABS = [
  { id: "all" as const, label: "All" },
  { id: "parent" as const, label: CATEGORY_LABELS.parent },
  { id: "mother" as const, label: CATEGORY_LABELS.mother },
  { id: "father" as const, label: CATEGORY_LABELS.father },
  { id: "doctor" as const, label: CATEGORY_LABELS.doctor },
];

type TabId = (typeof ALL_TABS)[number]["id"];

type TestimonialShowcaseProps = {
  cmsItems?: StorefrontTestimonial[];
  communityReviews?: EnrichedPublicReview[];
  heading?: string;
  description?: string;
  showCarousel?: boolean;
  showFeatured?: boolean;
};

function TestimonialAvatar({ testimonial }: { testimonial: TrustTestimonial }) {
  const photo = testimonial.photoUrl ?? testimonial.avatarUrl;

  if (photo) {
    return (
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-cream-100">
        <Image
          src={photo}
          alt=""
          fill
          loading="lazy"
          sizes="48px"
          placeholder="blur"
          blurDataURL={resolveImageBlur(blurForGeneratedUrl(photo))}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100/90 font-heading text-sm font-bold text-green-800"
    >
      {testimonial.name.charAt(0)}
    </span>
  );
}

function TestimonialMeta({ testimonial }: { testimonial: TrustTestimonial }) {
  return (
    <div className="min-w-0">
      <p className="font-heading text-base font-semibold text-green-900">{testimonial.name}</p>
      <p className="font-body text-sm leading-snug text-green-600/90">
        {[testimonial.role, testimonial.city].filter(Boolean).join(" · ")}
      </p>
      {(testimonial.productUsed || testimonial.babyAge || testimonial.date) ? (
        <p className="mt-1 font-body text-xs text-green-700">
          {[testimonial.productUsed, testimonial.babyAge ? `Baby ${testimonial.babyAge}` : null, testimonial.date]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="text-base leading-none tracking-[0.1em] text-terra-500"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true">{"★".repeat(rating)}</span>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  featured = false,
}: {
  testimonial: TrustTestimonial;
  featured?: boolean;
}) {
  return (
    <Card
      as="article"
      variant="glass"
      radius="4xl"
      padding={featured ? "none" : "lg"}
      hover={!featured}
      fullHeight
      className={cn(
        "homepage-card flex h-full flex-col",
        featured ? "homepage-testimonial-featured min-h-[20rem] p-8 sm:p-10" : "min-h-[17rem]",
      )}
    >
      <Stars rating={testimonial.rating} />

      <blockquote
        className={cn(
          "mt-5 flex-1 font-body text-green-800",
          featured ? "leading-[1.72]" : "text-base leading-[1.75]",
        )}
      >
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>

      <footer className="mt-8 flex items-center gap-3.5 border-t border-cream-200/80 pt-6">
        <TestimonialAvatar testimonial={testimonial} />
        <TestimonialMeta testimonial={testimonial} />
      </footer>
    </Card>
  );
}

function renderHeading(text: string) {
  if (text.includes("\n")) {
    return text.split("\n").map((line, i, arr) => (
      <span key={line}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));
  }
  return text;
}

function emptyTabLabel(tabId: TabId): string {
  if (tabId === "all") return "reviews";
  return CATEGORY_LABELS[tabId].toLowerCase();
}

export default function TestimonialShowcase({
  cmsItems = [],
  communityReviews = [],
  heading = "Trusted By Families,\nLoved By Babies",
  description = "Real stories from parents and health professionals who trust BeyondBabyCo.",
  showFeatured = true,
}: TestimonialShowcaseProps) {
  const reviews = useMemo(
    () => mergeTestimonials(cmsItems, communityReviews),
    [cmsItems, communityReviews],
  );

  const [activeCategory, setActiveCategory] = useState<TabId>("all");

  const availableTabs = useMemo(
    () =>
      ALL_TABS.filter(
        (tab) => tab.id === "all" || reviews.some((review) => review.category === tab.id),
      ),
    [reviews],
  );

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, availableTabs]);

  if (reviews.length === 0) return null;

  const avgRating = computeAverageRating(reviews);
  const featured = getFeaturedTestimonial(reviews);

  const filtered =
    activeCategory === "all"
      ? reviews
      : reviews.filter((review) => review.category === activeCategory);

  const showFeaturedCard =
    showFeatured &&
    featured != null &&
    (activeCategory === "all" || featured.category === activeCategory);

  const gridItems = filtered.filter((review) => !showFeaturedCard || review.id !== featured?.id);
  const hasVisibleReviews = showFeaturedCard || gridItems.length > 0;
  const showWriteReviewCta = activeCategory === "all" && reviews.length <= 3;

  return (
    <section
      className="homepage-section section-padding scroll-reveal relative overflow-visible bg-white"
      aria-labelledby="testimonials-heading"
    >
      <HomepageMascotGuide
        mascot="benny-bear"
        pose="celebration"
        size={160}
        placementClassName="right-4 -top-12 xl:right-8 xl:-top-16"
        bounce
      />
      <div className="container relative">
        <header className="homepage-section-header mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md">
            Social Proof
          </Badge>
          <h2 id="testimonials-heading" className="section-heading homepage-section-title">
            {renderHeading(heading)}
          </h2>
          <AccentBar width="lg" align="center" className="homepage-section-accent" />
          <p className="section-subcopy homepage-section-intro mx-auto">{description}</p>
          <p
            className="mt-4 font-heading text-lg font-semibold text-green-900"
            aria-label={`${reviews.length} reviews, average rating ${avgRating} out of 5`}
          >
            {reviews.length} Review{reviews.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 font-body text-sm text-green-700">
            <span aria-hidden="true">★ {avgRating}</span> average rating
          </p>
        </header>

        {availableTabs.length > 1 ? (
          <div
            className="homepage-testimonial-filters homepage-section-grid flex flex-wrap justify-center gap-2.5"
            role="tablist"
            aria-label="Filter testimonials"
          >
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-[var(--duration-fast)]",
                  focusRing,
                  activeCategory === tab.id
                    ? "bg-green-800 text-cream-50"
                    : "border border-green-200 bg-white text-green-800 hover:border-green-400",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {hasVisibleReviews ? (
          <>
            {showFeaturedCard && featured ? (
              <Reveal as="div" variant="fadeUp" delay={0.1} className="homepage-section-grid mx-auto mt-2 max-w-3xl">
                <p className="mb-4 text-center font-heading text-xs font-semibold uppercase tracking-[0.16em] text-terra-600">
                  Featured Story
                </p>
                <TestimonialCard testimonial={featured} featured />
              </Reveal>
            ) : null}

            {gridItems.length > 0 ? (
              <div
                className={cn(
                  "homepage-testimonial-grid homepage-section-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  homepageGridGap,
                )}
              >
                {gridItems.map((review, index) => (
                  <Reveal key={review.id} as="div" variant="fadeUp" delay={0.12 + index * 0.06} className="h-full">
                    <TestimonialCard testimonial={review} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">No {emptyTabLabel(activeCategory)} yet</p>
            <p className="mt-1 text-sm text-gray-600">Be the first to share your story!</p>
            {activeCategory === "all" ? (
              <div className="mx-auto mt-8 max-w-2xl text-left">
                <WriteReviewCta />
              </div>
            ) : null}
          </div>
        )}

        {showWriteReviewCta ? (
          <Reveal as="div" variant="fadeUp" delay={0.2} className="homepage-section-grid mx-auto mt-10 max-w-2xl">
            <WriteReviewCta />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
