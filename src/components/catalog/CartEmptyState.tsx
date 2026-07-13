"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import Button from "@/components/ui/Button";
import { Mascot } from "@/components/mascots";
import { ctaHeight } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const BELLA_CART_IMAGE = "/mascots/bella/bella-01-default.webp";

type CartEmptyStateProps = {
  className?: string;
};

export default function CartEmptyState({ className }: CartEmptyStateProps) {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center",
        className,
      )}
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        {useFallback ? (
          <Mascot mascot="bella-bunny" pose="default" size={160} animated floating alt="" />
        ) : (
          <Image
            src={BELLA_CART_IMAGE}
            alt="Bella Bunny"
            width={160}
            height={160}
            sizes="160px"
            className="object-contain"
            priority
            onError={() => setUseFallback(true)}
          />
        )}
      </div>

      <h2 className="mt-6 font-heading text-[clamp(1.375rem,2.5vw,1.75rem)] font-bold text-green-900">
        Your cart is empty
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-[1.75] text-green-700/88">
        When you find something gentle for your little one, it will appear here.
      </p>

      <Button asChild variant="primary" className={cn(ctaHeight, "mt-8 min-w-[200px] font-semibold")}>
        <Link href="/products">Explore Products</Link>
      </Button>
    </div>
  );
}
