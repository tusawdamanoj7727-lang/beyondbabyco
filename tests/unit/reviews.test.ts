import { describe, expect, it } from "vitest";

import {
  DEMO_GALLERY_ITEMS,
  DEMO_QUESTIONS,
  mergeReviewsWithDemo,
  getDemoQuestionsForProduct,
} from "@/lib/reviews/demo-data";
import {
  aggregateProsCons,
  computeReviewSummary,
  filterQuestions,
  filterReviews,
  paginateReviews,
  sortReviews,
} from "@/lib/reviews/helpers";
import { faqJsonLd, reviewJsonLd } from "@/lib/seo/json-ld";

describe("reviews helpers", () => {
  const reviews = mergeReviewsWithDemo("test-product", [], "Test Product");

  it("merges demo reviews when DB is empty", () => {
    expect(reviews.length).toBeGreaterThanOrEqual(5);
    expect(reviews[0].productId).toBe("test-product");
    expect(reviews.every((r) => r.isSample)).toBe(true);
    expect(reviews.every((r) => !r.verifiedPurchase)).toBe(true);
  });

  it("computes rating summary and distribution", () => {
    const summary = computeReviewSummary(reviews);
    expect(summary.reviewCount).toBe(reviews.length);
    expect(summary.averageRating).toBeGreaterThan(0);
    expect(summary.ratingDistribution[5]).toBeGreaterThan(0);
  });

  it("aggregates pros and cons", () => {
    const { pros, cons } = aggregateProsCons(reviews);
    expect(pros.length).toBeGreaterThan(0);
    expect(cons.length).toBeGreaterThan(0);
  });

  it("filters and sorts reviews", () => {
    const filtered = filterReviews(reviews, {
      search: "gentle",
      rating: "all",
      verifiedOnly: false,
      withPhotos: false,
    });
    expect(filtered.length).toBeGreaterThan(0);

    const sorted = sortReviews(reviews, "highest");
    expect(sorted[0].rating).toBeGreaterThanOrEqual(sorted[sorted.length - 1].rating);
  });

  it("paginates reviews", () => {
    const page = paginateReviews(reviews, 1, 2);
    expect(page.items).toHaveLength(2);
    expect(page.pageCount).toBe(Math.ceil(reviews.length / 2));
  });
});

describe("Q&A demo data", () => {
  it("includes answered and pending questions", () => {
    const questions = getDemoQuestionsForProduct("abc");
    expect(questions.some((q) => q.status === "answered")).toBe(true);
    expect(questions.some((q) => q.status === "pending")).toBe(true);
  });

  it("filters questions by search and category", () => {
    const filtered = filterQuestions(DEMO_QUESTIONS, { search: "paraben", category: "ingredients" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((q) => q.category === "ingredients")).toBe(true);
  });

  it("includes pinned answers", () => {
    const withPinned = DEMO_QUESTIONS.flatMap((q) => q.answers).some((a) => a.isPinned);
    expect(withPinned).toBe(true);
  });
});

describe("gallery demo data", () => {
  it("includes photo gallery items with valid product slugs", () => {
    expect(DEMO_GALLERY_ITEMS.every((i) => i.type === "photo")).toBe(true);
    expect(DEMO_GALLERY_ITEMS.some((i) => i.productSlug?.includes("calendula"))).toBe(true);
  });
});

describe("review SEO schema", () => {
  it("emits review and FAQ JSON-LD", () => {
    const reviews = mergeReviewsWithDemo("x", [], "Product");
    const reviewSchema = reviewJsonLd(
      reviews.slice(0, 2).map((r) => ({
        author: r.customerName,
        rating: r.rating,
        body: r.body ?? "",
        date: r.createdAt,
      })),
    );
    expect(reviewSchema).toBeTruthy();
    expect(Array.isArray(reviewSchema)).toBe(true);

    const faq = faqJsonLd(
      DEMO_QUESTIONS.filter((q) => q.answers.length).map((q) => ({
        question: q.question,
        answer: q.answers[0].body,
      })),
    );
    expect(faq?.["@type"]).toBe("FAQPage");
  });
});
