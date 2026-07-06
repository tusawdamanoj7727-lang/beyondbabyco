"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

import { Mascot } from "@/components/mascots";
import Button from "@/components/ui/Button";

type StorefrontErrorBoundaryProps = {
  children: React.ReactNode;
  /** Tag for filtering in Sentry (e.g. cart, checkout). */
  context: string;
};

function ErrorFallback({
  error,
  resetError,
  context,
}: {
  error: unknown;
  resetError: () => void;
  context: string;
}) {
  return (
    <section className="premium-page-bg flex min-h-[50vh] items-center py-16">
      <div className="container w-full">
        <div className="glass-surface-strong mx-auto flex max-w-lg flex-col items-center rounded-[2rem] px-8 py-12 text-center">
          <Mascot mascot="poppy-panda" pose="peek" size={120} animated floating alt="" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-terra-600">
            Something went wrong
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-green-900">
            {context === "checkout" ? "Checkout error" : "Cart error"}
          </h1>
          <p className="mt-3 max-w-md text-base text-green-700/80">
            Please try again. If the problem continues, our care team is happy to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="primary" onClick={() => resetError()}>
              Try again
            </Button>
            <Link href="/">
              <Button variant="secondary">Back to home</Button>
            </Link>
          </div>
          {process.env.NODE_ENV === "development" && error instanceof Error ? (
            <p className="mt-6 max-w-md break-words text-left text-xs text-red-600/80">{error.message}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function StorefrontErrorBoundary({ children, context }: StorefrontErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag("storefront_section", context);
      }}
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} context={context} />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
