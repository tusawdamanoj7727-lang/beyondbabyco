import type { Metadata } from "next";
import { getImageProps } from "next/image";

import HomePageWithReviews from "@/components/homepage/HomePageWithReviews";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import { HERO_DEFAULT_BLUR } from "@/lib/homepage/visual-assets";
import { IMAGE_QUALITY } from "@/lib/media/image-delivery";
import { IMAGES } from "@/lib/images";
import { buildHomepageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getStorefrontHomepage();
  const title =
    data.published && data.seo.title.trim()
      ? data.seo.title
      : "BeyondBabyCo — Every Baby Deserves The Safest Touch";
  const description =
    data.published && data.seo.description.trim()
      ? data.seo.description
      : "Safe, research-backed baby care products created with love and developed through years of research by BeyondBabyCo.";

  return buildHomepageMetadata({ title, description, path: "/" });
}

export default async function Home() {
  const data = await getStorefrontHomepage();
  const resolved = resolveVisualUrl(data.hero.imageUrl, {
    category: "hero",
    slug: "gentle-care-hero",
  });
  const heroLcpImage = resolved.url || IMAGES.hero.mother_baby;

  /**
   * Single-URL preload (~2× mobile hero CSS width). Avoids Next's multi-width
   * imageSrcSet preload which delayed LCP discovery (measured ~1.6s load delay).
   */
  const { props: heroPreload } = getImageProps({
    src: heroLcpImage,
    alt: "",
    width: 640,
    height: 512,
    quality: IMAGE_QUALITY.hero,
    placeholder: "blur",
    blurDataURL: data.hero.imageUrl?.trim()
      ? resolveVisualUrl(data.hero.imageUrl, { category: "hero", slug: "gentle-care-hero" }).blur
      : HERO_DEFAULT_BLUR,
  });

  return (
    <>
      <link rel="preload" as="image" href={heroPreload.src} fetchPriority="high" />
      <div className="homepage-main">
        <HomePageWithReviews data={data} />
      </div>
    </>
  );
}
