"use client";

import { Clock, MessageCircleQuestion, ThumbsUp } from "lucide-react";
import { useState } from "react";

import AnswerCard from "@/components/reviews/AnswerCard";
import { formatReviewDate } from "@/lib/reviews/helpers";
import { QA_CATEGORY_LABELS, type ProductQuestion } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

export default function QuestionCard({ question, className }: { question: ProductQuestion; className?: string }) {
  const [helpful, setHelpful] = useState(false);
  const [count, setCount] = useState(question.helpfulCount);
  const sortedAnswers = [...question.answers].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <article
      className={cn("rounded-2xl border border-cream-200 bg-white p-5 shadow-sm", className)}
      aria-labelledby={`question-${question.id}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-terra-500" aria-hidden="true" />
          <div>
            <h4 id={`question-${question.id}`} className="font-heading text-base font-bold text-green-900">
              {question.question}
            </h4>
            <p className="mt-1 text-xs text-green-700/60">
              Asked by {question.askedBy} ·{" "}
              <time dateTime={question.createdAt}>{formatReviewDate(question.createdAt)}</time>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            {QA_CATEGORY_LABELS[question.category]}
          </span>
          {question.status === "pending" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Pending answer
            </span>
          ) : null}
        </div>
      </header>

      {sortedAnswers.length > 0 ? (
        <div className="mt-4 space-y-3" aria-label="Answers">
          {sortedAnswers.map((a) => (
            <AnswerCard key={a.id} answer={a} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          Our care team is preparing an answer. Check back soon — or browse similar questions below.
        </p>
      )}

      <footer className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setHelpful((prev) => {
              setCount((c) => (prev ? c - 1 : c + 1));
              return !prev;
            });
          }}
          aria-pressed={helpful}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
            helpful ? "bg-terra-100 text-terra-800" : "text-green-700/80 hover:bg-cream-100",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          Question helpful ({count})
        </button>
      </footer>
    </article>
  );
}
