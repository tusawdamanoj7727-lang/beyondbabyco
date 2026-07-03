"use client";

import Image from "next/image";

import PremiumSectionBackdrop from "@/components/ui/PremiumSectionBackdrop";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { beyondCarePhotos } from "@/lib/homepage/visual-assets";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { blurForGeneratedUrl } from "@/lib/brand/generated-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const LINES = [
  {
    title: "Men Care",
    description: "Research-led grooming essentials — the same safety standards as our baby line.",
    image: beyondCarePhotos.men,
  },
  {
    title: "Women Care",
    description: "Gentle everyday rituals — dermatologically considered, launching after baby care.",
    image: beyondCarePhotos.women,
  },
] as const;

export default function CatalogBeyondCare() {
  const { openNotifyMe } = useNotifyMe();

  return (
    <section className="relative mb-12 overflow-hidden rounded-4xl border border-white/70">
      <PremiumSectionBackdrop variant="white" className="rounded-4xl" />
      <div className="relative z-10 p-6 lg:p-8">
        <div className="mb-6 max-w-2xl">
          <Badge variant="default" size="md">
            Beyond Baby Care
          </Badge>
          <h2 className="mt-3 font-heading text-2xl font-bold text-green-900 sm:text-3xl">
            Launching Soon
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-green-700/85">
            Men and women care lines are research-complete and arriving after our 2026 baby collection launch.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {LINES.map((line) => (
            <Card
              key={line.title}
              as="article"
              variant="glass"
              radius="3xl"
              padding="none"
              hover
              className="group overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={line.image}
                  alt=""
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 480px"
                  placeholder="blur"
                  blurDataURL={resolveImageBlur(
                    blurForGeneratedUrl(line.title === "Men Care" ? beyondCarePhotos.men : beyondCarePhotos.women),
                  )}
                  className="object-cover transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/50 via-transparent to-transparent" />
                <Badge variant="comingSoon" size="sm" className="absolute left-4 top-4">
                  Launching 2026
                </Badge>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl font-bold text-green-900">{line.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-green-700/88">{line.description}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-terra-600">
                  Research complete
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  type="button"
                  className={cn("mt-4", focusRing)}
                  onClick={() => openNotifyMe(line.title, "Beyond Care")}
                >
                  Notify Me
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
