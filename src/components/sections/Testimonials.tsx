"use client";

import Image from "next/image";

import MotionSection from "../ui/MotionSection";
import Reveal from "../ui/Reveal";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import AccentBar from "../ui/AccentBar";
import { TESTIMONIALS as TESTIMONIALS_COPY } from "@/lib/brand/copy";
import { TESTIMONIALS } from "../../lib/data";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import type { TestimonialsConfig } from "@/lib/admin/homepage-schema";
import type { StorefrontTestimonial } from "@/lib/homepage/storefront";

const CARD_DELAYS = [0.34, 0.42, 0.5];

function renderHeading(text: string) {
  if (text.includes("\n")) {
    return text.split("\n").map((line, i, arr) => (
      <span key={`${line}-${i}`}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));
  }
  return text;
}

export default function Testimonials({
  heading,
  items,
}: {
  heading?: TestimonialsConfig;
  items?: StorefrontTestimonial[];
}) {
  const sectionHeading = heading?.heading?.trim() || TESTIMONIALS_COPY.heading;
  const description = heading?.description?.trim() || TESTIMONIALS_COPY.intro;
  const testimonials = items?.length ? items : TESTIMONIALS.map((t) => ({ ...t, avatarUrl: t.avatarUrl ?? null }));

  return (
    <MotionSection as="section" variant="fadeUp" className="section-padding bg-white">
      <div className="container w-full">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal as="div" variant="fadeUp" delay={0} className="section-eyebrow">
            <Badge variant="default" size="md">
              {TESTIMONIALS_COPY.eyebrow}
            </Badge>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.1} className="w-full">
            <h2 className="section-heading">{renderHeading(sectionHeading)}</h2>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.18} className="section-intro">
            <AccentBar width="lg" align="center" />
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.26} className="section-intro w-full">
            <p className="section-subcopy mx-auto max-w-[720px]">{description}</p>
          </Reveal>
        </div>

        <div className="section-grid-gap grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={`${testimonial.name}-${index}`}
              as="div"
              variant="fadeUp"
              delay={CARD_DELAYS[index] ?? 0}
              className="w-full"
            >
              <Card
                as="div"
                variant="glass"
                radius="4xl"
                padding="lg"
                hover
                fullHeight
                className="flex flex-col"
              >
                <div className="text-lg leading-none tracking-[0.12em] text-terra-500">
                  <span className="sr-only">
                    {testimonial.rating} out of 5 stars
                  </span>
                  <span aria-hidden="true">{"★".repeat(testimonial.rating)}</span>
                </div>

                <p className="mt-4 font-body text-base leading-[1.75] text-green-800">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="mt-auto flex items-center gap-3 border-t border-cream-200/80 pt-6">
                  {testimonial.avatarUrl ? (
                    <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-green-100">
                      <Image
                        src={testimonial.avatarUrl}
                        alt=""
                        fill
                        loading="lazy"
                        sizes="44px"
                        placeholder="blur"
                        blurDataURL={resolveImageBlur(blurForGeneratedUrl(testimonial.avatarUrl))}
                        className="object-cover object-center"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100/90 font-heading text-sm font-bold text-green-800"
                    >
                      {testimonial.name.charAt(0)}
                    </span>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-heading text-base font-bold text-green-800">
                      {testimonial.name}
                    </span>
                    <span className="font-body text-sm text-green-600/90">
                      {testimonial.city}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
