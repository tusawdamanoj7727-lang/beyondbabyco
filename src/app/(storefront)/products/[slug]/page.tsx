import type { Metadata } from "next";
import { getImageProps } from "next/image";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ProductAnalyticsTracker from "@/components/analytics/ProductAnalyticsTracker";
import DeferredProductViewTracker from "@/components/catalog/DeferredProductViewTracker";
import ProductGallery from "@/components/catalog/ProductGallery";
import JsonLd from "@/components/seo/JsonLd";
import { LAUNCH_PRODUCT_SLUGS } from "@/lib/catalog/availability";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/storefront";
import { productUnit } from "@/lib/catalog/product-images";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import { getProductReviews } from "@/lib/reviews/queries";
import { buildProductMetadata, truncateMetaDescription } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, reviewJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";

export const revalidate = 60;

export function generateStaticParams() {
  return [...LAUNCH_PRODUCT_SLUGS].map((slug) => ({ slug }));
}

const ProductDetailTabs = dynamic(() => import("@/components/catalog/ProductDetailTabs"), {
  loading: () => <div className="mt-20 min-h-[240px]" aria-hidden="true" />,
});

const ProductPurchasePanel = dynamic(() => import("@/components/catalog/ProductPurchasePanel"), {
  loading: () => <div className="min-h-[420px] animate-pulse rounded-2xl bg-green-50/60" aria-hidden="true" />,
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const unit = productUnit(slug);
  const title = unit
    ? `${product.name} ${unit}`
    : (product.seoTitle ?? product.name);
  const description = truncateMetaDescription(
    product.seoDescription ??
      product.shortDescription ??
      product.description ??
      "",
  );

  const keywords = [
    product.name,
    product.categoryName ?? "baby care",
    "BeyondBabyCo",
    "dermatologically tested",
  ].filter(Boolean);

  return buildProductMetadata({
    title,
    description,
    path: `/products/${slug}`,
    productSlug: slug,
    image: product.imageUrl ?? undefined,
    keywords,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [{ reviews, summary: dbSummary }, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.categoryId, 4),
  ]);

  const reviewSummary = reviews.length > 0 ? dbSummary : computeReviewSummary([]);
  const productFaqs = product.faqs.map((f) => ({ question: f.question, answer: f.answer }));
  const faqSchema = productFaqs.length > 0 ? faqJsonLd(productFaqs) : null;

  const sortedImages = [...product.images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const primaryImage = sortedImages[0];
  const lcpImageSrc = primaryImage?.url ?? product.imageUrl;

  const productPreload =
    lcpImageSrc != null
      ? getImageProps({
          src: lcpImageSrc,
          alt: primaryImage?.alt ?? product.name,
          fill: true,
          priority: true,
          sizes: IMAGE_SIZES.productDetail,
          quality: IMAGE_QUALITY.product,
          placeholder: "blur",
          blurDataURL: resolveImageBlur(primaryImage?.blurDataUrl),
        })
      : null;

  return (
    <>
      {productPreload ? (
        <link
          rel="preload"
          as="image"
          href={productPreload.props.src}
          imageSrcSet={productPreload.props.srcSet}
          imageSizes={productPreload.props.sizes}
          fetchPriority="high"
        />
      ) : null}
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Products", url: "/products" },
            { name: product.name },
          ]),
          productJsonLd({
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
            slug: product.slug,
            imageUrl: product.imageUrl ? absoluteUrl(product.imageUrl) : null,
            price: product.effectivePrice,
            compareAtPrice: product.compareAtPrice,
            inStock: product.inStock,
            ratingAvg: reviews.length > 0 ? reviewSummary.averageRating || product.ratingAvg : 0,
            ratingCount: reviews.length > 0 ? reviewSummary.reviewCount || product.ratingCount : 0,
            brandName: product.brandName ?? SITE_NAME,
          }),
          ...(reviews.length > 0
            ? reviewJsonLd(
                reviews.map((r) => ({
                  author: r.customerName,
                  rating: r.rating,
                  body: r.body ?? "",
                  date: r.createdAt,
                })),
                { name: product.name, slug: product.slug },
              ) ?? []
            : []),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <ProductAnalyticsTracker product={product} />
      <DeferredProductViewTracker productId={product.id} />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
      />
      <div className="container pb-28 md:pb-20">
        <div className="pdp-above-fold grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductPurchasePanel product={product} />
        </div>
        <ProductDetailTabs
          product={product}
          reviews={reviews}
          reviewSummary={reviewSummary}
          questions={[]}
          related={related}
        />
      </div>
    </>
  );
}
