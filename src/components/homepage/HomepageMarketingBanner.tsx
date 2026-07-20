import Image from "next/image";
import Link from "next/link";

import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";

/** Clickable homepage / campaign banner with desktop + mobile assets. */
export default function HomepageMarketingBanner({ slot }: { slot: StorefrontCampaignSlot }) {
  const href = slot.ctaUrl || slot.targetUrl || "/products";
  const desktop = slot.heroUrl || slot.bannerUrl;
  const mobile = slot.bannerUrl || slot.heroUrl;

  if (!desktop && !mobile) {
    return (
      <section className="container py-6">
        <Link
          href={href}
          className="block rounded-3xl px-6 py-8 text-center shadow-card sm:px-10"
          style={{ backgroundColor: slot.theme.background, color: slot.theme.primary }}
        >
          <p className="font-display text-xl font-semibold sm:text-2xl">{slot.headline}</p>
          {slot.subheading ? <p className="mt-2 text-sm opacity-80 sm:text-base">{slot.subheading}</p> : null}
          <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-green-800 px-5 text-sm font-semibold text-cream-50">
            {slot.ctaLabel || "Shop now"}
          </span>
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-3 sm:py-6">
      <Link href={href} className="group relative block overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-400">
        <div className="relative aspect-[5/2] w-full sm:aspect-[21/7]">
          {mobile ? (
            <Image
              src={mobile}
              alt={slot.headline || "Campaign banner"}
              fill
              loading="lazy"
              sizes={IMAGE_SIZES.categoryCard}
              quality={IMAGE_QUALITY.editorial}
              className="object-cover sm:hidden"
            />
          ) : null}
          {desktop ? (
            <Image
              src={desktop}
              alt={slot.headline || "Campaign banner"}
              fill
              loading="lazy"
              sizes={IMAGE_SIZES.categoryCard}
              quality={IMAGE_QUALITY.editorial}
              className={mobile ? "hidden object-cover sm:block" : "object-cover"}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <p className="font-display text-lg font-semibold text-white sm:text-2xl">{slot.headline}</p>
            {slot.subheading ? <p className="mt-1 text-sm text-white/85">{slot.subheading}</p> : null}
          </div>
        </div>
      </Link>
    </section>
  );
}
