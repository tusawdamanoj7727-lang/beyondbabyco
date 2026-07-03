"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";

import Reveal from "../ui/Reveal";
import AccentBar from "../ui/AccentBar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { NewsletterConfig } from "@/lib/admin/homepage-schema";
import {
  newsletterSubscribeAction,
  type NewsletterSubscribeState,
} from "@/lib/auth/newsletter-actions";
import { NEWSLETTER } from "@/lib/brand/copy";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { ctaHeight, formControl } from "@/lib/design/ui";
import { newsletterPhoto } from "@/lib/homepage/visual-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

const initialState: NewsletterSubscribeState = { error: null, success: null };

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
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(newsletterSubscribeAction, initialState);

  const heading = config?.heading?.trim() || NEWSLETTER.heading;
  const description = config?.description?.trim() || NEWSLETTER.description;
  const buttonText = config?.buttonText?.trim() || NEWSLETTER.button;
  const artworkRaw =
    config?.imageUrl?.trim() || config?.artworkUrl?.trim() || newsletterPhoto.main;
  const artwork = resolveVisualUrl(artworkRaw, { category: "newsletter", slug: "care-tips" });

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.success, state.error, toast]);

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
                ref={formRef}
                action={formAction}
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
                  placeholder={NEWSLETTER.placeholder}
                  required
                  disabled={isPending}
                  aria-invalid={state.error ? true : undefined}
                  aria-describedby={
                    state.error ? "newsletter-error" : state.success ? "newsletter-success" : undefined
                  }
                  className={cn(formControl, "flex-1 rounded-full px-5 shadow-[var(--shadow-premium)]")}
                />
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  className={cn("w-full shrink-0 sm:w-auto sm:min-w-[11rem]", ctaHeight)}
                  disabled={isPending}
                >
                  {isPending ? "Joining…" : buttonText}
                </Button>
              </form>
              {state.error ? (
                <p id="newsletter-error" role="alert" className="mt-3 text-sm text-terra-600">
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p id="newsletter-success" role="status" className="mt-3 text-sm text-green-700">
                  {state.success}
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
                sizes="(max-width: 1024px) 70vw, 336px"
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
