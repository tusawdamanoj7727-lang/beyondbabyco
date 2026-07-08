import Image from "next/image";

import Badge from "@/components/ui/Badge";
import AccentBar from "@/components/ui/AccentBar";
import { TrustIcon } from "@/components/trust/TrustIcons";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { SUSTAINABILITY_GOALS, SUSTAINABILITY_INTRO, SUSTAINABILITY_ITEMS } from "@/lib/trust";

type SustainabilitySectionProps = {
  id?: string;
};

export default function SustainabilitySection({ id = "sustainability" }: SustainabilitySectionProps) {
  return (
    <section
      id={id}
      className="scroll-reveal section-padding bg-cream-50"
      aria-labelledby="sustainability-heading"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md">
            Sustainability
          </Badge>
          <h2 id="sustainability-heading" className="section-heading mt-4">
            Caring for Families and Our Planet
          </h2>
          <AccentBar width="lg" align="center" className="mt-4" />
          <p className="section-subcopy mt-4">{SUSTAINABILITY_INTRO}</p>
        </div>

        <div className="section-grid-gap mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SUSTAINABILITY_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="scroll-reveal-item surface-card h-full p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {item.image ? (
                <div className="mb-4 overflow-hidden rounded-2xl">
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? item.title}
                    width={640}
                    height={360}
                    placeholder="blur"
                    blurDataURL={resolveImageBlur(blurForGeneratedUrl(item.image))}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <TrustIcon name={item.icon} className="h-6 w-6 text-green-700" />
                </span>
              )}
              <h3 className="font-heading text-lg font-bold text-green-900">{item.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-green-700/90">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="scroll-reveal-item mx-auto mt-12 max-w-2xl" style={{ animationDelay: "200ms" }}>
          <h3 className="text-center font-heading text-lg font-bold text-green-900">Future Goals</h3>
          <ul className="mt-4 space-y-2">
            {SUSTAINABILITY_GOALS.map((goal) => (
              <li
                key={goal}
                className="flex items-start gap-2 rounded-xl border border-green-100 bg-white/90 px-4 py-3 text-sm text-green-700/90"
              >
                <span aria-hidden="true" className="mt-0.5 text-terra-500">
                  ◆
                </span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
