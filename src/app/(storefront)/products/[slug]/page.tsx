import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ProductDetailTabs from "@/components/catalog/ProductDetailTabs";
import ProductGallery from "@/components/catalog/ProductGallery";
import ProductPurchasePanel from "@/components/catalog/ProductPurchasePanel";
import ProductViewTracker from "@/components/catalog/ProductViewTracker";
import JsonLd from "@/components/seo/JsonLd";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/storefront";
import { productUnit } from "@/lib/catalog/product-images";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import { getProductReviews } from "@/lib/reviews/queries";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, reviewJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, getCanonicalSiteUrl, SITE_NAME } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found — BeyondBabyCo" };
  }

  const baseUrl = getCanonicalSiteUrl();
  const canonical = `${baseUrl}/products/${slug}`;
  const unit = productUnit(slug);
  const title = unit
    ? `${product.name} ${unit} — BeyondBabyCo`
    : `${product.seoTitle ?? product.name} — BeyondBabyCo`;
  const description = (
    product.seoDescription ??
    product.shortDescription ??
    product.description ??
    ""
  ).slice(0, 155);
  const ogImage = product.imageUrl
    ? absoluteUrl(product.imageUrl)
    : absoluteUrl("/images/og/og-products.jpg");

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${product.name} — BeyondBabyCo`,
      description,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
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

  return (
    <>
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
              ) ?? []
            : []),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <ProductViewTracker productId={product.id} />
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
