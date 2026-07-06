"use client";

import Image from "next/image";
import Link from "next/link";

import PremiumSectionBackdrop from "@/components/ui/PremiumSectionBackdrop";
import MotionSection from "../ui/MotionSection";
import Reveal from "../ui/Reveal";
import Card from "../ui/Card";
import AccentBar from "../ui/AccentBar";
import Badge from "../ui/Badge";
import { CATEGORIES } from "@/lib/brand/copy";
import { CATEGORY_ITEMS } from "../../lib/data";
import { categoryBrowseHref } from "@/lib/catalog/category-links";
import { focusRing } from "@/lib/design/ui";
import type { StorefrontCategoryItem } from "@/lib/homepage/storefront";
import { blurForGeneratedUrl } from "@/lib/brand/generated-assets";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

const CARD_DELAYS = [0.28, 0.34, 0.4, 0.46, 0.52, 0.58, 0.64, 0.7];

export default function CategoriesSection({
  heading,
  categories,
}: {
  heading?: string;
  categories?: StorefrontCategoryItem[];
}) {
  const sectionHeading = heading?.trim() || CATEGORIES.heading;
  const items = categories?.length ? categories : CATEGORY_ITEMS;

  return (
    <MotionSection
      as="section"
      id="categories"
      variant="fadeUp"
      className="section-padding relative overflow-hidden"
    >
      <PremiumSectionBackdrop variant="cream" />

      <div className="container relative z-10 w-full">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal as="div" variant="fadeUp" delay={0} className="section-eyebrow">
            <Badge variant="default" size="md">
              {CATEGORIES.eyebrow}
            </Badge>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.1} className="w-full">
            <h2 className="section-heading">{sectionHeading}</h2>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.18} className="section-intro">
            <AccentBar width="lg" align="center" />
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.24} className="section-intro w-full">
            <p className="section-subcopy prose-width mx-auto">
              {CATEGORIES.intro}
            </p>
          </Reveal>
        </div>

        <div className="section-grid-gap grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {items.map((category, index) => {
            const href = categoryBrowseHref(category.title);
            const imageSrc = category.imageUrl ?? category.icon;

            const card = (
              <Card
                as="div"
                variant="glass"
                radius="3xl"
                padding="none"
                hover={!!href}
                fullHeight
                className="group overflow-hidden border border-white/70"
              >
                <div className="product-image-stage relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    loading="lazy"
                    sizes={IMAGE_SIZES.categoryCard}
                    quality={IMAGE_QUALITY.editorial}
                    placeholder="blur"
                    blurDataURL={resolveImageBlur(
                      blurForGeneratedUrl(imageSrc),
                    )}
                    className="object-cover object-[center_20%] transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-950/70 via-green-900/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                    <h3 className="font-heading text-xl font-bold text-cream-50">{category.title}</h3>
                    <p className="mt-1 font-body text-sm text-cream-50/85">{category.count}</p>
                  </div>
                </div>
              </Card>
            );

            return (
              <Reveal
                key={`${category.title}-${index}`}
                as="div"
                variant="fadeUp"
                delay={CARD_DELAYS[index] ?? 0}
                className="w-full"
              >
                {href ? (
                  <Link href={href} className={cn("block h-full rounded-3xl", focusRing)}>
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
