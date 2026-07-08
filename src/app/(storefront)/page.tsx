import { Suspense } from "react";
import type { Metadata } from "next";
import { getImageProps } from "next/image";

import HomePageContent from "@/components/homepage/HomePageContent";
import HomePageWithReviews from "@/components/homepage/HomePageWithReviews";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import { HERO_DEFAULT_BLUR } from "@/lib/homepage/visual-assets";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { IMAGES } from "@/lib/images";
import { buildHomepageMetadata } from "@/lib/seo/metadata";

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
  const heroLcpImage = (() => {
    const resolved = resolveVisualUrl(data.hero.imageUrl, {
      category: "hero",
      slug: "gentle-care-hero",
    });
    return resolved.url || IMAGES.hero.mother_baby;
  })();

  const heroPreload = getImageProps({
    src: heroLcpImage,
    alt: data.hero.imageAlt,
    fill: true,
    priority: true,
    sizes: IMAGE_SIZES.hero,
    quality: IMAGE_QUALITY.hero,
    placeholder: "blur",
    blurDataURL: data.hero.imageUrl?.trim()
      ? resolveVisualUrl(data.hero.imageUrl, { category: "hero", slug: "gentle-care-hero" }).blur
      : HERO_DEFAULT_BLUR,
  });

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={heroPreload.props.src}
        imageSrcSet={heroPreload.props.srcSet}
        imageSizes={heroPreload.props.sizes}
        fetchPriority="high"
      />
      <div className="homepage-main">
        <Suspense fallback={<HomePageContent data={data} communityReviews={[]} />}>
          <HomePageWithReviews data={data} />
        </Suspense>
      </div>
    </>
  );
}
