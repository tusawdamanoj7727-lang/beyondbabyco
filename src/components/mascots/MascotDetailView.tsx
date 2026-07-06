import Link from "next/link";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ProductListingGrid from "@/components/catalog/ProductListingGrid";
import MascotHeroImage from "@/components/mascots/MascotHeroImage";
import { Mascot } from "@/components/mascots";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { mascotFloatDuration } from "@/lib/mascots";
import {
  getRelatedMascotProfiles,
  MASCOT_COLOR_STYLES,
  mascotPagePath,
  type MascotProfile,
} from "@/lib/mascots/profiles";
import { cn } from "@/lib/utils";

export default function MascotDetailView({
  mascot,
  products,
}: {
  mascot: MascotProfile;
  products: StorefrontProduct[];
}) {
  const related = getRelatedMascotProfiles(mascot.slug);
  const styles = MASCOT_COLOR_STYLES[mascot.color];

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Mascots", href: "/mascots" },
          { label: mascot.fullName },
        ]}
      />

      <section className="border-b border-green-100/80 bg-gradient-to-b from-cream-50/80 to-white">
        <div className="container grid items-center gap-10 pb-12 pt-4 md:grid-cols-2 md:gap-12 md:pb-16">
          <div className="flex justify-center md:order-2">
            <MascotHeroImage
              heroImage={mascot.heroImage}
              mascotId={mascot.mascotId}
              alt={`${mascot.fullName} waving hello`}
              size={380}
              priority
              className="mx-auto"
            />
          </div>

          <div className="md:order-1">
            <Badge variant="default" size="md" className="mb-4">
              {mascot.personality}
            </Badge>
            <h1 className="font-heading text-[clamp(2.25rem,4vw,3.25rem)] font-bold leading-tight text-green-900">
              {mascot.fullName}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-green-700/90 md:text-xl">{mascot.tagline}</p>
            <p className={cn("mt-3 text-sm font-semibold uppercase tracking-wide", styles.accent)}>
              {mascot.categoryLabel}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/products?category=${mascot.categorySlug}`}>
                <Button variant="primary" type="button">
                  Shop {mascot.categoryLabel}
                </Button>
              </Link>
              <Link href="/mascots">
                <Button variant="outline" type="button">
                  Meet the family
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <h2 className="font-heading text-2xl font-bold text-green-900 md:text-3xl">
          {mascot.fullName.split(" ")[0]}&apos;s favourite products
        </h2>
        <p className="mt-2 max-w-2xl text-green-700/85">
          Hand-picked formulas that match {mascot.fullName.split(" ")[0]}&apos;s care philosophy.
        </p>
        <div className="mt-8">
          <ProductListingGrid products={products} />
        </div>
      </section>

      <section className="border-y border-green-100/80 bg-cream-50/60 py-12 md:py-16">
        <div className="container">
          <h2 className="font-heading text-2xl font-bold text-green-900 md:text-3xl">Fun facts</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {mascot.funFacts.map((fact) => (
              <li
                key={fact}
                className="rounded-2xl border border-green-100 bg-white/90 p-5 text-sm leading-relaxed text-green-800 shadow-sm"
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="container py-12 md:py-16">
          <h2 className="font-heading text-2xl font-bold text-green-900 md:text-3xl">More friends to meet</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((friend) => {
              const friendStyles = MASCOT_COLOR_STYLES[friend.color];
              return (
                <Link
                  key={friend.slug}
                  href={mascotPagePath(friend.slug)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500",
                    friendStyles.card,
                  )}
                >
                  <Mascot
                    mascot={friend.mascotId}
                    pose={friend.hubPose}
                    size={88}
                    animated
                    floating
                    duration={mascotFloatDuration(friend.mascotId)}
                    alt={`${friend.fullName} mascot`}
                  />
                  <div className="min-w-0 text-left">
                    <p className="font-heading text-lg font-bold text-green-900">{friend.fullName}</p>
                    <p className="text-sm text-green-700/80">{friend.personality}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
