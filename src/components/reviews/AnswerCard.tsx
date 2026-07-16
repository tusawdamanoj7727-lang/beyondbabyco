"use client";

import { Pin, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { formatReviewDate } from "@/lib/reviews/helpers";
import type { ProductAnswer } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

export default function AnswerCard({
  answer,
  className,
}: {
  answer: ProductAnswer;
  className?: string;
}) {
  const [helpful, setHelpful] = useState(false);
  const [count, setCount] = useState(answer.helpfulCount);

  function toggleHelpful() {
    setHelpful((prev) => {
      setCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  }

  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        answer.isPinned ? "border-terra-200 bg-terra-50/40" : "border-cream-200 bg-cream-50/30",
        className,
      )}
      aria-labelledby={`answer-${answer.id}-author`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {answer.isPinned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-terra-100 px-2 py-0.5 text-xs font-semibold text-terra-800">
            <Pin className="h-3 w-3" aria-hidden="true" />
            Pinned answer
          </span>
        ) : null}
        {answer.authorRole === "brand" ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Official</span>
        ) : null}
        {answer.authorRole === "expert" ? (
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-green-800">Expert</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-green-800">{answer.body}</p>
      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-green-700">
        <p id={`answer-${answer.id}-author`}>
          — {answer.authorName}
          <time className="ml-2" dateTime={answer.createdAt}>
            {formatReviewDate(answer.createdAt)}
          </time>
        </p>
        <button
          type="button"
          onClick={toggleHelpful}
          aria-pressed={helpful}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
            helpful ? "bg-terra-100 text-terra-800" : "hover:bg-cream-100 text-green-700",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          Helpful ({count})
        </button>
      </footer>
    </article>
  );
}
