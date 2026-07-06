"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

import Reveal from "../ui/Reveal";
import AccentBar from "../ui/AccentBar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import type { NewsletterConfig } from "@/lib/admin/homepage-schema";
import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";
import { NEWSLETTER } from "@/lib/brand/copy";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { ctaHeight, formControl } from "@/lib/design/ui";
import { newsletterPhoto } from "@/lib/homepage/visual-assets";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

function renderHeading(text: string) {
  if (text.includes("\n")) {
    return text.split("\n").map((line, i, arr) => (
      <span key={`${line}-${i}`}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));
  }
  return text;
}

export default function NewsletterCTA({ config }: { config?: NewsletterConfig }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const heading = config?.heading?.trim() || NEWSLETTER.heading;
  const description = config?.description?.trim() || NEWSLETTER.description;
  const buttonText = config?.buttonText?.trim() || NEWSLETTER.button;
  const artworkRaw =
    config?.imageUrl?.trim() || config?.artworkUrl?.trim() || newsletterPhoto.main;
  const artwork = resolveVisualUrl(artworkRaw, { category: "newsletter", slug: "care-tips" });

  async function handleSubscribe() {
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage_newsletter" }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      setStatus(data.success ? "success" : "error");
      setMessage(data.message || data.error || NEWSLETTER_MESSAGES.error);

      if (data.success) {
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage(NEWSLETTER_MESSAGES.error);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubscribe();
  }

  return (
    <section
      id="newsletter"
      className="homepage-section homepage-newsletter section-padding scroll-reveal relative overflow-hidden"
    >
      <div aria-hidden="true" className="homepage-grain pointer-events-none absolute inset-0 opacity-[0.02]" />

      <div className="container relative z-10 w-full">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
          <div className="flex w-full flex-col items-start">
            <Reveal as="div" variant="fadeUp" delay={0}>
              <Badge variant="default" size="md">
                {NEWSLETTER.eyebrow}
              </Badge>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.1} className="homepage-section-title w-full">
              <h2 className="section-heading">{renderHeading(heading)}</h2>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.18} className="homepage-section-accent">
              <AccentBar width="lg" align="left" />
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.26} className="homepage-section-intro w-full">
              <p className="text-body prose-measure text-green-800/88">{description}</p>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.34} className="mt-10 w-full">
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="homepage-newsletter-form flex w-full max-w-[36rem] flex-col gap-3 sm:flex-row sm:items-stretch"
                noValidate
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Enter your email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== "idle") {
                      setStatus("idle");
                      setMessage("");
                    }
                  }}
                  placeholder={NEWSLETTER.placeholder}
                  required
                  disabled={status === "loading"}
                  aria-invalid={status === "error" ? true : undefined}
                  aria-describedby={
                    status === "error"
                      ? "newsletter-error"
                      : status === "success"
                        ? "newsletter-success"
                        : undefined
                  }
                  className={cn(formControl, "flex-1 rounded-full px-5 shadow-[var(--shadow-premium)]")}
                />
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  loading={status === "loading"}
                  className={cn("w-full shrink-0 sm:w-auto sm:min-w-[11rem]", ctaHeight)}
                  disabled={status === "loading"}
                >
                  {buttonText}
                </Button>
              </form>
              {status === "loading" ? (
                <p className="mt-3 text-sm text-green-800/70" aria-live="polite">
                  Subscribing…
                </p>
              ) : null}
              {status === "error" && message ? (
                <p id="newsletter-error" role="alert" className="mt-3 text-sm text-red-600">
                  {message}
                </p>
              ) : null}
              {status === "success" && message ? (
                <p id="newsletter-success" role="status" className="mt-3 text-sm font-medium text-green-700">
                  {message}
                </p>
              ) : null}
            </Reveal>
          </div>

          <Reveal as="div" variant="scaleIn" delay={0.2} className="flex w-full justify-center lg:justify-end">
            <div
              className="premium-image-frame homepage-newsletter-art relative aspect-[3/4] w-full max-w-[19rem] overflow-hidden sm:max-w-[21rem]"
              aria-hidden="true"
            >
              <Image
                src={artwork.url}
                alt=""
                fill
                loading="lazy"
                sizes={IMAGE_SIZES.lifestyleHero}
                quality={IMAGE_QUALITY.editorial}
                placeholder="blur"
                blurDataURL={resolveImageBlur(artwork.blur)}
                className="object-cover object-[center_22%]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
