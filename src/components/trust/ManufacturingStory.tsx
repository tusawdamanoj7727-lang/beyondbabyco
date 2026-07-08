import Image from "next/image";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import { TrustIcon } from "@/components/trust/TrustIcons";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { MANUFACTURING_STEPS } from "@/lib/trust";

type ManufacturingStoryProps = {
  id?: string;
};

export default function ManufacturingStory({ id = "manufacturing-story" }: ManufacturingStoryProps) {
  return (
    <section
      id={id}
      className="scroll-reveal section-padding bg-white"
      aria-labelledby="manufacturing-story-heading"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md">
            Manufacturing Story
          </Badge>
          <h2 id="manufacturing-story-heading" className="section-heading mt-4">
            From Raw Materials to Your Doorstep
          </h2>
          <AccentBar width="lg" align="center" className="mt-4" />
          <p className="section-subcopy mt-4">
            Every BeyondBabyCo product follows a traceable journey through quality-controlled production,
            packaging, and delivery.
          </p>
        </div>

        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-green-200 lg:block"
          />
          <ol className="space-y-10">
            {MANUFACTURING_STEPS.map((step, index) => (
              <li key={step.id}>
                <div className="scroll-reveal-item" style={{ animationDelay: `${index * 50}ms` }}>
                  <div
                    className={`grid items-center gap-6 lg:grid-cols-2 ${index % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
                  >
                    <div className={`${index % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                      <div className="overflow-hidden rounded-3xl shadow-clay">
                        <Image
                          src={step.illustration}
                          alt={step.illustrationAlt}
                          width={960}
                          height={600}
                          placeholder="blur"
                          blurDataURL={resolveImageBlur(blurForGeneratedUrl(step.illustration))}
                          className="aspect-[16/10] w-full object-cover"
                          loading="lazy"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    </div>
                    <div className={`relative flex gap-4 ${index % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-cream-50">
                        <TrustIcon name={step.icon} className="h-6 w-6" />
                      </span>
                      <div>
                        <Badge variant="default" size="sm">
                          Step {index + 1}
                        </Badge>
                        <h3 className="mt-2 font-heading text-xl font-bold text-green-900">{step.title}</h3>
                        <p className="mt-2 font-body text-base leading-relaxed text-green-700/90">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
