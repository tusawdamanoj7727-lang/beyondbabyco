"use client";

import { useActionState, useEffect, useRef } from "react";

import AccentBar from "@/components/ui/AccentBar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  earlyAccessSubscribeAction,
  type NewsletterSubscribeState,
} from "@/lib/auth/newsletter-actions";
import { ctaHeight, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const initialState: NewsletterSubscribeState = { error: null, success: null };

export default function EarlyAccessSection() {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(earlyAccessSubscribeAction, initialState);

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
              ref={formRef}
              action={formAction}
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
                placeholder="Your email address"
                required
                disabled={isPending}
                aria-invalid={state.error ? true : undefined}
                aria-describedby={
                  state.error ? "early-access-error" : state.success ? "early-access-success" : "early-access-note"
                }
                className={cn(formControl, "flex-1 rounded-full px-5 shadow-[var(--shadow-premium)]")}
              />
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={isPending}
                className={cn("w-full shrink-0 sm:w-auto sm:min-w-[11.5rem]", ctaHeight)}
              >
                {isPending ? "Joining…" : "Get Early Access"}
              </Button>
            </form>

            {state.error ? (
              <p id="early-access-error" role="alert" className="mt-3 text-sm text-terra-600">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p id="early-access-success" role="status" className="mt-3 text-sm text-green-700">
                {state.success}
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
