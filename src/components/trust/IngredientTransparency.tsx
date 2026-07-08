"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import MotionSection from "@/components/ui/MotionSection";
import { CORE_INGREDIENTS, type IngredientProfile } from "@/lib/trust";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";

function IngredientCard({ ingredient }: { ingredient: IngredientProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card as="article" variant="glass" radius="3xl" padding="lg" fullHeight className="flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
        <Image
          src={ingredient.image}
          alt={ingredient.imageAlt}
          fill
          loading="lazy"
          sizes="(max-width: 1024px) 100vw, 33vw"
          placeholder="blur"
          blurDataURL={resolveImageBlur(blurForGeneratedUrl(ingredient.image))}
          className="object-cover"
        />
      </div>
      <h3 className="mt-4 font-heading text-xl font-bold text-green-900">{ingredient.name}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="font-semibold text-green-800">Origin</dt>
          <dd className="text-green-700/90">{ingredient.origin}</dd>
        </div>
        <div>
          <dt className="font-semibold text-green-800">Purpose</dt>
          <dd className="text-green-700/90">{ingredient.purpose}</dd>
        </div>
      </dl>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-green-100 bg-cream-50/80 px-4 py-2.5 text-left text-sm font-semibold text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
      >
        Full ingredient profile
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 border-t border-green-100 pt-3 text-sm">
          <div>
            <p className="font-semibold text-green-800">Benefits</p>
            <ul className="mt-1 list-inside list-disc text-green-700/90">
              {ingredient.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-green-800">Safety Profile</p>
            <p className="text-green-700/90">{ingredient.safetyProfile}</p>
          </div>
          <div>
            <p className="font-semibold text-green-800">Skin Compatibility</p>
            <p className="text-green-700/90">{ingredient.skinCompatibility}</p>
          </div>
          <div>
            <p className="font-semibold text-green-800">Suitable Age</p>
            <p className="text-green-700/90">{ingredient.suitableAge}</p>
          </div>
          <div>
            <p className="font-semibold text-green-800">Research Summary</p>
            <p className="text-green-700/90">{ingredient.researchSummary}</p>
          </div>
          <div>
            <p className="font-semibold text-green-800">Related Products</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {ingredient.relatedProducts.map((p) => (
                <li key={p.name}>
                  <Link
                    href={p.href}
                    className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-800 hover:border-green-400"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

type IngredientTransparencyProps = {
  id?: string;
  limit?: number;
};

export default function IngredientTransparency({ id = "ingredients", limit }: IngredientTransparencyProps) {
  const items = limit ? CORE_INGREDIENTS.slice(0, limit) : CORE_INGREDIENTS;

  return (
    <MotionSection
      as="section"
      id={id}
      variant="fadeUp"
      className="section-padding bg-cream-50"
      aria-labelledby="ingredient-transparency-heading"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md">
            Ingredient Transparency
          </Badge>
          <h2 id="ingredient-transparency-heading" className="section-heading mt-4">
            Know What Touches Your Baby&apos;s Skin
          </h2>
          <AccentBar width="lg" align="center" className="mt-4" />
          <p className="section-subcopy mt-4">
            Every core ingredient is chosen for a clear purpose. Tap any card for the full profile — origin,
            safety, research, and related products.
          </p>
        </div>

        <div className="section-grid-gap mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ingredient, index) => (
            <Reveal key={ingredient.id} as="div" variant="fadeUp" delay={index * 0.06}>
              <IngredientCard ingredient={ingredient} />
            </Reveal>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
