"use client";

import { type FormEvent } from "react";

import AccentBar from "@/components/ui/AccentBar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { useNewsletterSubscribe } from "@/lib/newsletter/use-newsletter-subscribe";
import { ctaHeight, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function EarlyAccessSection() {
  const { email, setEmail, status, msg, handleSubscribe } = useNewsletterSubscribe(
    "homepage_early_access",
    {
      mapSuccessMessage: (data) =>
        data.message?.includes("Already")
          ? "You're already on the early access list — we'll email your launch offer soon."
          : "You're on the early access list! Watch for your 20% off code at launch.",
    },
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubscribe();
  }

  return (
    <section
      id="early-access"
      className="homepage-section section-padding scroll-reveal bg-gradient-to-b from-cream-50/90 to-white"
      aria-labelledby="early-access-heading"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="div" variant="fadeUp" delay={0}>
            <Badge variant="default" size="md">
              Launching soon
            </Badge>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.08} className="mt-5">
            <h2 id="early-access-heading" className="section-heading homepage-section-title">
              Be among the first to try BeyondBabyCo
            </h2>
            <AccentBar width="lg" align="center" className="homepage-section-accent mx-auto" />
            <p className="section-subcopy homepage-section-intro mx-auto mt-4">
              We&apos;re launching soon. Get early access and 20% off your first order.
            </p>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.16} className="mt-10">
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-stretch"
              noValidate
            >
              <label htmlFor="early-access-email" className="sr-only">
                Email address
              </label>
              <input
                id="early-access-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                disabled={status === "loading"}
                aria-invalid={status === "error" ? true : undefined}
                aria-describedby={
                  status === "error"
                    ? "early-access-error"
                    : status === "success"
                      ? "early-access-success"
                      : "early-access-note"
                }
                className={cn(formControl, "flex-1 rounded-full px-5 shadow-[var(--shadow-premium)]")}
              />
              <Button
                variant="primary"
                type="submit"
                size="lg"
                loading={status === "loading"}
                disabled={status === "loading"}
                className={cn("w-full shrink-0 sm:w-auto sm:min-w-[11.5rem]", ctaHeight)}
              >
                Get Early Access
              </Button>
            </form>

            {status === "error" && msg ? (
              <p id="early-access-error" role="alert" className="mt-3 text-sm text-red-600">
                {msg}
              </p>
            ) : null}
            {status === "success" && msg ? (
              <p id="early-access-success" role="status" className="mt-3 text-sm font-medium text-green-700">
                {msg}
              </p>
            ) : (
              <p id="early-access-note" className="mt-4 font-body text-xs text-green-700/70">
                No spam. Unsubscribe anytime.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
