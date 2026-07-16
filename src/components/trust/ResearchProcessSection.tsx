import Image from "next/image";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import { TrustIcon } from "@/components/trust/TrustIcons";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { RESEARCH_PROCESS_STEPS } from "@/lib/trust";

type ResearchProcessSectionProps = {
  id?: string;
  compact?: boolean;
};

export default function ResearchProcessSection({ id = "research", compact = false }: ResearchProcessSectionProps) {
  const steps = compact ? RESEARCH_PROCESS_STEPS.slice(0, 5) : RESEARCH_PROCESS_STEPS;

  return (
    <section
      id={id}
      className="scroll-reveal section-padding bg-white"
      aria-labelledby="research-process-heading"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md">
            Our Research Process
          </Badge>
          <h2 id="research-process-heading" className="section-heading mt-4">
            {compact ? "How We Build Trust" : "From Research to Your Home"}
          </h2>
          <AccentBar width="lg" align="center" className="mt-4" />
          <p className="section-subcopy mt-4">
            Every BeyondBabyCo product passes through a rigorous 10-step development process — because your
            baby&apos;s skin deserves nothing less than our most careful work.
          </p>
        </div>

        <ol className="relative mt-12 space-y-0" aria-label="Research process timeline">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <li key={step.id} className="relative pb-12 last:pb-0">
                <div
                  className="scroll-reveal-item"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {!compact && index < steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-6 top-16 hidden h-[calc(100%-4rem)] w-0.5 bg-green-200 lg:block"
                    />
                  ) : null}
                  <div
                    className={`grid items-center gap-8 lg:grid-cols-2 ${!isEven ? "lg:[direction:rtl]" : ""}`}
                  >
                    <div className={`${!isEven ? "lg:[direction:ltr]" : ""}`}>
                      <div className="flex items-start gap-4">
                        <span
                          aria-hidden="true"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800"
                        >
                          <TrustIcon name={step.icon} className="h-6 w-6" />
                        </span>
                        <div>
                          <Badge variant="default" size="sm">
                            Step {step.phase}
                          </Badge>
                          <h3 className="mt-2 font-heading text-xl font-bold text-green-900">{step.title}</h3>
                          <p className="mt-2 font-body text-base leading-relaxed text-green-800">
                            {step.description}
                          </p>
                          <Link
                            href={step.cta.href}
                            className="mt-4 inline-flex items-center rounded text-sm font-semibold text-terra-600 transition hover:text-terra-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
                          >
                            {step.cta.label} →
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className={`overflow-hidden rounded-3xl shadow-clay ${!isEven ? "lg:[direction:ltr]" : ""}`}>
                      <Image
                        src={step.illustration}
                        alt={step.illustrationAlt}
                        width={800}
                        height={600}
                        placeholder="blur"
                        blurDataURL={resolveImageBlur(blurForGeneratedUrl(step.illustration))}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {compact ? (
          <div className="mt-8 text-center">
            <Link
              href="/trust-center#research"
              className="inline-flex h-12 items-center justify-center rounded-full bg-terra-500 px-8 text-sm font-semibold text-white shadow-clay transition hover:bg-terra-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
            >
              View Full Research Process
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
