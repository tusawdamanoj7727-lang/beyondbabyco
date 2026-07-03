"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Mascot } from "@/components/mascots";
import Button from "@/components/ui/Button";
import { logger } from "@/lib/observability/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Storefront error boundary", { error, digest: error.digest });
  }, [error]);

  return (
    <section className="premium-page-bg flex min-h-[60vh] items-center py-20">
      <div className="container w-full">
        <div className="glass-surface-strong mx-auto flex max-w-lg flex-col items-center rounded-[2rem] px-8 py-12 text-center">
          <Mascot mascot="poppy-panda" pose="peek" size={120} animated floating alt="" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-terra-600">Something went wrong</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-green-900">Unexpected error</h1>
          <p className="mt-3 max-w-md text-base text-green-700/80">
            Please try again. If the problem continues, our care team is happy to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="primary" onClick={() => reset()}>
              Try again
            </Button>
            <Link href="/">
              <Button variant="secondary">Back to home</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
