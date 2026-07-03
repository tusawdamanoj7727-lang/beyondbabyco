import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ProductDetailTabs from "@/components/catalog/ProductDetailTabs";
import ProductGallery from "@/components/catalog/ProductGallery";
import ProductPurchasePanel from "@/components/catalog/ProductPurchasePanel";
import ProductViewTracker from "@/components/catalog/ProductViewTracker";
import JsonLd from "@/components/seo/JsonLd";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/storefront";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import { getProductReviews } from "@/lib/reviews/queries";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, reviewJsonLd } from "@/lib/seo/json-ld";
import { buildProductMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return {
    ...buildProductMetadata({
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription ?? undefined,
      path: `/products/${slug}`,
      image: product.imageUrl ?? undefined,
      productSlug: slug,
    }),
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
            slug: product.slug,
            imageUrl: product.imageUrl ? absoluteUrl(product.imageUrl) : null,
            price: product.effectivePrice,
            compareAtPrice: product.compareAtPrice,
            inStock: product.inStock,
            ratingAvg: reviews.length > 0 ? reviewSummary.averageRating || product.ratingAvg : 0,
            ratingCount: reviews.length > 0 ? reviewSummary.reviewCount || product.ratingCount : 0,
            brandName: product.brandName,
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
      <div className="container pb-28 lg:pb-20">
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
