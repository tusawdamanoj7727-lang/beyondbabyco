"use client";

import { useMemo, useState } from "react";

import EmptyState from "@/components/reviews/EmptyState";
import QuestionCard from "@/components/reviews/QuestionCard";
import { filterQuestions } from "@/lib/reviews/helpers";
import { QA_CATEGORY_LABELS, type ProductQuestion, type QACategory } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

const CATEGORIES: (QACategory | "all")[] = ["all", "usage", "ingredients", "safety", "shipping", "general"];

export default function ProductQASection({
  questions,
  productName,
  className,
}: {
  questions: ProductQuestion[];
  productName: string;
  isSample?: boolean;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<QACategory | "all">("all");

  const filtered = useMemo(() => filterQuestions(questions, { search, category }), [questions, search, category]);
  const answered = filtered.filter((q) => q.status === "answered");
  const pending = filtered.filter((q) => q.status === "pending");
  const frequent = questions.filter((q) => q.helpfulCount >= 15 && q.status === "answered").slice(0, 3);

  if (!questions.length) {
    return (
      <EmptyState
        title="No customer questions yet"
        description={`Be the first to ask about ${productName}. Our care team will answer here once questions arrive.`}
        mascot="bella-bunny"
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {frequent.length > 0 ? (
        <section aria-labelledby="faq-frequent-heading">
          <h3 id="faq-frequent-heading" className="font-heading text-lg font-bold text-green-900">
            Frequently asked
          </h3>
          <ul className="mt-4 space-y-4">
            {frequent.map((q) => (
              <li key={`freq-${q.id}`}>
                <QuestionCard question={q} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="qa-search-heading">
        <h3 id="qa-search-heading" className="font-heading text-lg font-bold text-green-900">
          Customer questions & answers
        </h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search questions</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions and answers…"
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QACategory | "all")}
              className="w-full rounded-2xl border border-cream-200 bg-white px-3 py-2.5 text-sm sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : QA_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {answered.length > 0 ? (
        <section aria-labelledby="qa-answered-heading">
          <h3 id="qa-answered-heading" className="font-heading text-base font-bold text-green-900">
            Answered ({answered.length})
          </h3>
          <ul className="mt-4 space-y-4">
            {answered.map((q) => (
              <li key={q.id}>
                <QuestionCard question={q} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending.length > 0 ? (
        <section aria-labelledby="qa-pending-heading">
          <h3 id="qa-pending-heading" className="font-heading text-base font-bold text-green-900">
            Awaiting answer ({pending.length})
          </h3>
          <ul className="mt-4 space-y-4">
            {pending.map((q) => (
              <li key={q.id}>
                <QuestionCard question={q} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-green-700/70" role="status">
          No questions match your search. Try another keyword or category.
        </p>
      ) : null}
    </div>
  );
}
