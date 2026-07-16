"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CatalogBundleRecommendations from "@/components/catalog/CatalogBundleRecommendations";
import ProductDetailTabNav, {
  PDP_TABS,
  pdpTabId,
  type ProductDetailTab,
} from "@/components/catalog/ProductDetailTabNav";
import RelatedProductCard from "@/components/catalog/RelatedProductCard";
import RecentlyViewed from "@/components/catalog/RecentlyViewed";
import { MICROCOPY } from "@/lib/brand/copy";
import ProductQASection from "@/components/reviews/ProductQASection";
import ProductReviewsPanel from "@/components/reviews/ProductReviewsPanel";
import { Mascot } from "@/components/mascots";
import { homepageGridGap } from "@/lib/design/ui";
import type { ProductReviewSummary } from "@/lib/admin/review-types";
import type { StorefrontBenefit, StorefrontFaq, StorefrontIngredient, StorefrontProduct, StorefrontProductDetail } from "@/lib/catalog/types";
import type { EnrichedPublicReview, ProductQuestion } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

type Tab = ProductDetailTab;

function tabFromHash(): Tab | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "").toLowerCase();
  if (!raw) return null;
  const match = PDP_TABS.find(
    (t) => pdpTabId(t) === raw || t.toLowerCase() === raw || t.toLowerCase().replace("&", "") === raw,
  );
  return match ?? null;
}

export default function ProductDetailTabs({
  product,
  reviews,
  reviewSummary,
  questions,
  related,
}: {
  product: StorefrontProductDetail;
  reviews: EnrichedPublicReview[];
  reviewSummary: ProductReviewSummary;
  questions: ProductQuestion[];
  questionsAreSample?: boolean;
  related: StorefrontProduct[];
}) {
  const [tab, setTab] = useState<Tab>("Benefits");
  const showQa = questions.length > 0;

  useEffect(() => {
    function applyHash() {
      const fromHash = tabFromHash();
      if (!fromHash) return;
      if (fromHash === "Q&A" && !showQa) return;
      setTab(fromHash);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [showQa]);

  return (
    <div className="mt-20 space-y-14 lg:mt-24">
      <ProductDetailTabNav activeTab={tab} onTabChange={setTab} showQa={showQa} />
      <div role="tabpanel" id={`panel-${pdpTabId(tab)}`} aria-labelledby={`tab-${pdpTabId(tab)}`}>
        <div className="pdp-tab-panel">
          {tab === "Benefits" ? <BenefitsPanel benefits={product.benefits} /> : null}
          {tab === "Ingredients" ? <IngredientsPanel ingredients={product.ingredients} /> : null}
          {tab === "Directions" ? <HowToUsePanel description={product.description} short={product.shortDescription} /> : null}
          {tab === "Safety" ? <SafetyPanel benefits={product.benefits} ingredients={product.ingredients} /> : null}
          {tab === "FAQ" ? <FaqPanel faqs={product.faqs} /> : null}
          {tab === "Research" ? <ResearchPanel description={product.description} /> : null}
          {tab === "Reviews" ? (
            <ProductReviewsPanel
              reviews={reviews}
              summary={reviewSummary}
              productName={product.name}
              productSlug={product.slug}
            />
          ) : null}
          {tab === "Q&A" && showQa ? (
            <ProductQASection questions={questions} productName={product.name} />
          ) : null}
        </div>
      </div>

      {related.length >= 2 ? <CatalogBundleRecommendations products={related} /> : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-products-heading">
          <h2 id="related-products-heading" className="pdp-related-heading">
            Related Products
          </h2>
          <div className={cn("homepage-section-grid mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", homepageGridGap)}>
            {related.map((p) => (
              <RelatedProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}

function BenefitsPanel({ benefits }: { benefits: StorefrontBenefit[] }) {
  if (!benefits.length) {
    return <TabEmptyState mascot="eli-elephant" title="Benefits" description={MICROCOPY.pdp.benefitsEmpty} />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
      {benefits.map((b) => (
        <li key={b.id} className="rounded-2xl border border-green-100/80 bg-cream-50/80 p-5 shadow-[var(--shadow-soft)]">
          <p className="font-heading text-base font-bold text-green-900">{b.icon ? `${b.icon} ` : ""}{b.name}</p>
          {b.description ? <p className="mt-2.5 text-sm leading-[1.75] text-green-800">{b.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function IngredientsPanel({ ingredients }: { ingredients: StorefrontIngredient[] }) {
  if (!ingredients.length) {
    return (
      <TabEmptyState
        mascot="gigi-giraffe"
        title="Ingredients"
        description={MICROCOPY.pdp.ingredientsEmpty}
      />
    );
  }
  return (
    <ul className="pdp-ingredient-grid">
      {ingredients.map((ing) => (
        <li key={ing.id} className="pdp-ingredient-card">
          <h3 className="font-semibold text-green-900">{ing.name}</h3>
          {ing.inciName ? <p className="pdp-ingredient-inci">{ing.inciName}</p> : null}
          {ing.description ? <p className="mt-3 text-sm leading-[1.75] text-green-800">{ing.description}</p> : null}
          {ing.notes ? <p className="mt-2 text-xs leading-relaxed text-green-700">{ing.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function parseHowToSteps(text: string): string[] {
  const numbered = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\s]+/, "").trim())
    .filter(Boolean);

  if (numbered.length >= 2) return numbered;

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length >= 2) return sentences.slice(0, 6);

  return [text.trim()];
}

function HowToUsePanel({ description, short }: { description: string | null; short: string | null }) {
  const text = description ?? short;
  if (!text) {
    return (
      <TabEmptyState
        mascot="penny-penguin"
        title="Directions"
        description={MICROCOPY.pdp.directionsEmpty}
      />
    );
  }

  const steps = parseHowToSteps(text);

  if (steps.length === 1) {
    return <div className="max-w-prose whitespace-pre-line text-base leading-[1.75] text-green-800">{text}</div>;
  }

  return (
    <ol className="pdp-step-grid">
      {steps.map((step, index) => (
        <li key={`step-${index}`} className="pdp-step-card">
          <span className="pdp-step-number" aria-hidden="true">
            {index + 1}
          </span>
          <p className="text-sm leading-[1.75] text-green-800 sm:text-base">{step}</p>
        </li>
      ))}
    </ol>
  );
}

function SafetyPanel({
  benefits,
  ingredients,
}: {
  benefits: StorefrontBenefit[];
  ingredients: StorefrontIngredient[];
}) {
  return (
    <div className="max-w-prose space-y-5 text-base leading-[1.75] text-green-800">
      <p>
        Every BeyondBabyCo formula is dermatologically tested and developed for delicate skin.
        Patch test on a small area before first use. Discontinue use if irritation occurs.
      </p>
      {benefits.some((b) => /safe|gentle|test/i.test(b.name)) ? (
        <ul className="list-disc space-y-2 pl-5">
          {benefits
            .filter((b) => /safe|gentle|test/i.test(b.name))
            .map((b) => (
              <li key={b.id}>{b.name}{b.description ? ` — ${b.description}` : ""}</li>
            ))}
        </ul>
      ) : null}
      {ingredients.length ? (
        <p className="text-sm text-green-700">
          Review the full ingredient list if your child has known sensitivities or allergies.
        </p>
      ) : null}
    </div>
  );
}

function FaqPanel({ faqs }: { faqs: StorefrontFaq[] }) {
  if (!faqs.length) {
    return (
      <TabEmptyState
        mascot="bella-bunny"
        title="FAQ"
        description={MICROCOPY.pdp.faqEmpty}
      />
    );
  }
  return (
    <div className="pdp-faq-list">
      {faqs.map((f) => (
        <details key={f.id} className="pdp-faq-item">
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

function ResearchPanel({ description }: { description: string | null }) {
  return (
    <div className="max-w-prose space-y-4 text-base leading-[1.75] text-green-800">
      <p>
        BeyondBabyCo products are developed through years of formulation research, ingredient screening,
        and safety testing before launch.
      </p>
      {description ? <p className="whitespace-pre-line">{description}</p> : null}
      <p>
        <Link href="/#research" className="font-semibold text-terra-600 hover:underline">
          Explore our research journey →
        </Link>
      </p>
    </div>
  );
}

function TabEmptyState({
  mascot,
  title,
  description,
}: {
  mascot: "bella-bunny" | "gigi-giraffe" | "poppy-panda" | "eli-elephant" | "penny-penguin";
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-cream-50/80 to-white px-6 py-12 text-center">
      <Mascot mascot={mascot} pose="welcome" size={96} animated floating alt="" />
      <p className="mt-4 font-heading text-lg font-bold text-green-900">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-[1.75] text-green-700">{description}</p>
    </div>
  );
}
