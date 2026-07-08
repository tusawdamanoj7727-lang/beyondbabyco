import Image from "next/image";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import { TrustIcon } from "@/components/trust/TrustIcons";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { DOCTOR_ADVISORY_BLOCKS, DOCTOR_ADVISORY_DISCLAIMER, DOCTOR_ADVISORY_IMAGE } from "@/lib/trust";

type DoctorAdvisorySectionProps = {
  id?: string;
  compact?: boolean;
};

export default function DoctorAdvisorySection({ id = "advisory", compact = false }: DoctorAdvisorySectionProps) {
  const blocks = compact ? DOCTOR_ADVISORY_BLOCKS.slice(0, 2) : DOCTOR_ADVISORY_BLOCKS;

  return (
    <section
      id={id}
      className="scroll-reveal section-padding bg-white"
      aria-labelledby="doctor-advisory-heading"
    >
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="default" size="md">
              Expert Guidance
            </Badge>
            <h2 id="doctor-advisory-heading" className="section-heading mt-4 text-left">
              {compact ? "Guided by Science" : "Pediatric & Dermatology Guidance"}
            </h2>
            <AccentBar width="md" align="left" className="mt-4" />
            <p className="mt-4 font-body text-base leading-relaxed text-green-700/90">
              BeyondBabyCo integrates professional health guidance into our development process — ensuring
              formulations reflect current best practices in infant skin care, without claiming individual
              endorsements.
            </p>

            <div className="mt-8 space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={block.title}
                  className="scroll-reveal-item glass-surface flex gap-4 rounded-3xl p-4"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                    <TrustIcon name={block.icon} className="h-5 w-5 text-green-700" />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-green-900">{block.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-green-700/90">{block.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {!compact ? (
              <p className="mt-6 rounded-xl border border-green-100 bg-cream-50/80 p-4 text-xs leading-relaxed text-green-700/80">
                {DOCTOR_ADVISORY_DISCLAIMER}
              </p>
            ) : null}
          </div>

          <div className="scroll-reveal-item overflow-hidden rounded-3xl shadow-clay" style={{ animationDelay: "120ms" }}>
            <Image
              src={DOCTOR_ADVISORY_IMAGE}
              alt="Research and health professional collaboration in product development"
              width={800}
              height={1000}
              placeholder="blur"
              blurDataURL={resolveImageBlur(blurForGeneratedUrl(DOCTOR_ADVISORY_IMAGE))}
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
