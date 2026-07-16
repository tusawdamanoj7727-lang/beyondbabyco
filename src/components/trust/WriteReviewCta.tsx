"use client";

import Link from "next/link";
import { useState } from "react";

import { brandWhatsAppUrl, isWhatsAppConfigured } from "@/lib/brand/contact";
import { ctaHeight, focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function WriteReviewCta({ className }: { className?: string }) {
  const [rating, setRating] = useState(5);
  const whatsappConfigured = isWhatsAppConfigured();

  const whatsappMessage = `Hi! I'd love to share my BeyondBabyCo experience. My rating: ${"⭐".repeat(rating)} (${rating}/5)`;

  return (
    <div
      className={cn(
        "rounded-3xl border border-cream-200/90 bg-cream-50/60 px-6 py-8 text-center sm:px-10",
        className,
      )}
    >
      <h3 className="font-heading text-xl font-bold text-green-900">
        Love BeyondBabyCo? Share your experience
      </h3>
      <p className="mt-2 text-sm text-green-700">
        Tap a star rating, then tell us what gentle care means for your family.
      </p>

      <div
        className="mt-5 flex items-center justify-center gap-1"
        role="group"
        aria-label="Select your star rating"
      >
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          const selected = value <= rating;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} out of 5 stars`}
              aria-pressed={selected}
              onClick={() => setRating(value)}
              className={cn(
                "rounded-lg px-1.5 py-1 text-2xl leading-none transition-colors",
                focusRing,
                selected ? "text-terra-500" : "text-cream-300 hover:text-terra-300",
              )}
            >
              ★
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/community"
          className={cn(
            "btn-primary-premium inline-flex items-center justify-center rounded-full px-6 text-sm font-semibold",
            ctaHeight,
            focusRing,
          )}
        >
          Write a review
        </Link>
        {whatsappConfigured ? (
          <a
            href={brandWhatsAppUrl(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "btn-secondary-premium inline-flex items-center justify-center rounded-full px-6 text-sm font-semibold",
              ctaHeight,
              focusRing,
            )}
          >
            Submit via WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
