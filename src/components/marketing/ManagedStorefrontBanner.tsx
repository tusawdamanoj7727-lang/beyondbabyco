import Image from "next/image";
import Link from "next/link";

import type { BannerListItem } from "@/lib/admin/banner-types";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { TrackBannerView } from "@/components/marketing/TrackBannerView";

/** Lazy, CLS-safe storefront banner from Banner Manager. */
export default function ManagedStorefrontBanner({ banner }: { banner: BannerListItem }) {
  const href = banner.linkUrl || "/products";
  const desktop = banner.imageUrl;
  const tablet = banner.tabletImageUrl || desktop;
  const mobile = banner.mobileImageUrl || desktop;
  const alt = banner.altText || banner.title || "Promotional banner";

  if (!desktop && !mobile && !banner.videoUrl) return null;

  return (
    <section className="container py-4 sm:py-6" aria-label={banner.ariaLabel || banner.title || "Banner"}>
      <TrackBannerView bannerId={banner.id} />
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
        data-banner-id={banner.id}
      >
        {banner.videoUrl && banner.mediaType === "video" ? (
          <video
            className="aspect-[16/7] w-full object-cover"
            src={banner.videoUrl}
            muted
            playsInline
            autoPlay
            loop
            preload="none"
            aria-label={alt}
          />
        ) : (
          <div className="relative aspect-[16/7] w-full bg-cream-100">
            {mobile ? (
              <Image
                src={mobile}
                alt={alt}
                fill
                loading="lazy"
                sizes={IMAGE_SIZES.categoryCard}
                quality={IMAGE_QUALITY.editorial}
                className="object-cover md:hidden"
              />
            ) : null}
            {tablet ? (
              <Image
                src={tablet}
                alt={alt}
                fill
                loading="lazy"
                sizes={IMAGE_SIZES.categoryCard}
                quality={IMAGE_QUALITY.editorial}
                className="hidden object-cover md:block lg:hidden"
              />
            ) : null}
            {desktop ? (
              <Image
                src={desktop}
                alt={alt}
                fill
                loading="lazy"
                sizes={IMAGE_SIZES.categoryCard}
                quality={IMAGE_QUALITY.editorial}
                className="hidden object-cover lg:block"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <p className="font-display text-lg font-semibold text-white sm:text-2xl">{banner.title}</p>
              {banner.subtitle ? <p className="mt-1 text-sm text-white/85">{banner.subtitle}</p> : null}
              {banner.ctaLabel ? (
                <span className="mt-3 inline-flex rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-green-900">
                  {banner.ctaLabel}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </Link>
    </section>
  );
}
