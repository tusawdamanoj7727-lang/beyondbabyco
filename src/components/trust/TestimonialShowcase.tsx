"use client";

import Image from "next/image";
import { useState } from "react";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import {
  computeAverageRating,
  getFeaturedTestimonial,
  mergeTestimonials,
  type TrustTestimonial,
  type TestimonialCategory,
} from "@/lib/trust";
import { blurForGeneratedUrl } from "@/lib/brand/generated-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { focusRing, homepageGridGap } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import type { StorefrontTestimonial } from "@/lib/homepage/storefront";

const CATEGORY_LABELS: Record<TestimonialCategory, string> = {
  parent: "Parent Stories",
  mother: "Mother Stories",
  father: "Father Stories",
  doctor: "Expert Perspectives",
};

type TestimonialShowcaseProps = {
  cmsItems?: StorefrontTestimonial[];
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
        <p className="mt-1 font-body text-xs text-green-700/65">
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
          "mt-5 flex-1 font-body text-green-700/90",
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

export default function TestimonialShowcase({
  cmsItems = [],
  heading = "Trusted By Families,\nLoved By Babies",
  description = "Real stories from parents and health professionals who trust BeyondBabyCo.",
  showFeatured = true,
}: TestimonialShowcaseProps) {
  const testimonials = mergeTestimonials(cmsItems);
  const avgRating = computeAverageRating(testimonials);
  const featured = getFeaturedTestimonial(testimonials);
  const [activeCategory, setActiveCategory] = useState<TestimonialCategory | "all">("all");

  const filtered =
    activeCategory === "all"
      ? testimonials
      : testimonials.filter((t) => t.category === activeCategory);

  const gridItems = filtered.filter((t) => t.id !== featured?.id).slice(0, 3);

  return (
    <section
      className="homepage-section section-padding scroll-reveal bg-white"
      aria-labelledby="testimonials-heading"
    >
      <div className="container">
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
            className="mt-4 font-heading text-base font-semibold text-green-900"
            aria-label={`Average rating ${avgRating} out of 5 from ${testimonials.length} reviews`}
          >
            <span aria-hidden="true">★ {avgRating}</span>
            <span className="ml-2 font-body text-sm font-normal text-green-700/80">
              average from {testimonials.length} reviews
            </span>
          </p>
        </header>

        <div
          className="homepage-testimonial-filters homepage-section-grid flex flex-wrap justify-center gap-2.5"
          role="tablist"
          aria-label="Filter testimonials"
        >
          {(["all", "parent", "mother", "father", "doctor"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-[var(--duration-fast)]",
                focusRing,
                activeCategory === cat
                  ? "bg-green-800 text-cream-50"
                  : "border border-green-200 bg-white text-green-800 hover:border-green-400",
              )}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {showFeatured && featured ? (
          <Reveal as="div" variant="fadeUp" delay={0.1} className="homepage-section-grid mx-auto mt-2 max-w-3xl">
            <p className="mb-4 text-center font-heading text-xs font-semibold uppercase tracking-[0.16em] text-terra-600">
              Featured Story
            </p>
            <TestimonialCard testimonial={featured} featured />
          </Reveal>
        ) : null}

        {gridItems.length > 0 ? (
          <div className={cn("homepage-testimonial-grid homepage-section-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", homepageGridGap)}>
            {gridItems.map((t, index) => (
              <Reveal key={t.id} as="div" variant="fadeUp" delay={0.12 + index * 0.06} className="h-full">
                <TestimonialCard testimonial={t} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
