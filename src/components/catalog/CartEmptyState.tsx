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
        "mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center",
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

      <h1 className="mt-8 font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#2d5a27]">
        Your cart is empty
      </h1>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-[#2d5a27]/75">
        When you find something gentle for your little one, it will appear here.
      </p>

      <Link href="/products" className="mt-8">
        <Button variant="primary" type="button" className={cn(ctaHeight, "min-w-[200px] font-semibold")}>
          Explore Products
        </Button>
      </Link>
    </div>
  );
}
