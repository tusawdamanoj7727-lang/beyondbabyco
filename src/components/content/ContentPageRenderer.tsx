import Link from "next/link";
import Image from "next/image";
import {
  Beaker,
  FlaskConical,
  Heart,
  Leaf,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import StaticSvgImage, { isStaticSvgUrl } from "@/components/media/StaticSvgImage";
import Card from "@/components/ui/Card";
import AccentBar from "@/components/ui/AccentBar";
import Badge from "@/components/ui/Badge";
import FaqAccordion, { ContactFormSection } from "@/components/content/ContentSections";
import DoctorAdvisorySection from "@/components/trust/DoctorAdvisorySection";
import IngredientTransparency from "@/components/trust/IngredientTransparency";
import ManufacturingStory from "@/components/trust/ManufacturingStory";
import QualityStandardsGrid from "@/components/trust/QualityStandardsGrid";
import ResearchProcessSection from "@/components/trust/ResearchProcessSection";
import SustainabilitySection from "@/components/trust/SustainabilitySection";
import TrustWidgets from "@/components/trust/TrustWidgets";
import { blurForGeneratedUrl } from "@/lib/brand/generated-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import type { ContentPage, ContentSection } from "@/lib/content/types";

const ICON_MAP: Record<string, LucideIcon> = {
  beaker: Beaker,
  flask: FlaskConical,
  heart: Heart,
  leaf: Leaf,
  shield: Shield,
  sparkles: Sparkles,
};

function SectionIntro({ title, paragraphs }: { title?: string; paragraphs: string[] }) {
  return (
    <section className="section-padding bg-white">
      <div className="container max-w-3xl">
        {title ? <h2 className="section-heading">{title}</h2> : null}
        <div className={`space-y-4 ${title ? "mt-6" : ""}`}>
          {paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="section-subcopy text-left">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionCards({
  title,
  description,
  items,
  columns = 3,
}: Extract<ContentSection, { type: "cards" }>) {
  const gridClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="section-padding bg-cream-50">
      <div className="container">
        {(title || description) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {title ? <h2 className="section-heading">{title}</h2> : null}
            {description ? (
              <>
                <AccentBar width="lg" align="center" className="mt-4" />
                <p className="section-subcopy mt-4">{description}</p>
              </>
            ) : null}
          </div>
        )}
        <div className={`grid grid-cols-1 gap-6 ${gridClass}`}>
          {items.map((item) => {
            const Icon = item.icon ? ICON_MAP[item.icon] : null;
            const inner = (
              <Card
                as="div"
                variant="glass"
                radius="3xl"
                padding="lg"
                hover={Boolean(item.href)}
                fullHeight
                className="text-center"
              >
                {item.image ? (
                  <span className="relative mx-auto block h-16 w-16">
                    {isStaticSvgUrl(item.image) ? (
                      <StaticSvgImage
                        src={item.image}
                        alt={item.imageAlt ?? ""}
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Image
                        src={item.image}
                        alt={item.imageAlt ?? ""}
                        fill
                        loading="lazy"
                        sizes="64px"
                        placeholder="blur"
                        blurDataURL={resolveImageBlur(blurForGeneratedUrl(item.image))}
                        className="object-contain"
                      />
                    )}
                  </span>
                ) : Icon ? (
                  <Icon className="mx-auto h-10 w-10 text-green-700" aria-hidden="true" />
                ) : item.icon ? (
                  <span className="text-4xl" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <h3 className="mt-4 font-heading text-xl font-bold text-green-800">{item.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-green-700/90">{item.description}</p>
              </Card>
            );
            return item.href ? (
              <Link key={item.title} href={item.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={item.title}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionImageSplit({
  title,
  paragraphs,
  image,
  imageAlt,
  reverse,
}: Extract<ContentSection, { type: "imageSplit" }>) {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div
          className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[direction:rtl]" : ""}`}
        >
          <div className={reverse ? "lg:[direction:ltr]" : ""}>
            <h2 className="section-heading text-left">{title}</h2>
            <AccentBar width="md" align="left" className="mt-4" />
            <div className="mt-6 space-y-4">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="font-body text-base leading-relaxed text-green-700/90">
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl shadow-clay ${reverse ? "lg:[direction:ltr]" : ""}`}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={resolveImageBlur(blurForGeneratedUrl(image))}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTimeline({ title, description, items }: Extract<ContentSection, { type: "timeline" }>) {
  return (
    <section className="section-padding bg-cream-50">
      <div className="container max-w-3xl">
        {title ? <h2 className="section-heading text-center">{title}</h2> : null}
        {description ? <p className="section-subcopy mt-4 text-center">{description}</p> : null}
        <ol className={`relative border-l-2 border-green-200 ${title || description ? "mt-10" : ""} pl-8`}>
          {items.map((item) => (
            <li key={item.year} className="mb-10 last:mb-0">
              <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-green-600 bg-cream-50" />
              <Badge variant="default" size="sm">
                {item.year}
              </Badge>
              <h3 className="mt-2 font-heading text-lg font-bold text-green-900">{item.title}</h3>
              <p className="mt-1 font-body text-sm leading-relaxed text-green-700/90">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SectionTrustBadges({
  title,
  description,
  badges,
}: Extract<ContentSection, { type: "trustBadges" }>) {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        {(title || description) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {title ? <h2 className="section-heading">{title}</h2> : null}
            {description ? <p className="section-subcopy mt-4">{description}</p> : null}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center rounded-2xl border border-green-100 bg-cream-50/80 p-5 text-center"
            >
              {badge.image ? (
                isStaticSvgUrl(badge.image) ? (
                  <StaticSvgImage
                    src={badge.image}
                    alt={badge.imageAlt ?? badge.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                  />
                ) : (
                  <Image
                    src={badge.image}
                    alt={badge.imageAlt ?? badge.title}
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-14 w-14 object-contain"
                  />
                )
              ) : null}
              <p className="mt-3 font-heading text-xs font-bold uppercase tracking-wide text-green-800">
                {badge.title}
              </p>
              {badge.description ? (
                <p className="mt-1 font-body text-xs text-green-700/80">{badge.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionStats({ items }: Extract<ContentSection, { type: "stats" }>) {
  return (
    <section className="bg-green-900 py-12 text-cream-50">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-extrabold text-cream-50 lg:text-4xl">{stat.value}</p>
              <p className="mt-1 font-body text-sm text-cream-100/85">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionLegal({ lastUpdated, sections }: Extract<ContentSection, { type: "legal" }>) {
  return (
    <section className="section-padding bg-white">
      <div className="container max-w-3xl">
        <p className="font-body text-sm text-green-700/70">Last updated: {lastUpdated}</p>
        <div className="mt-8 space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-heading text-xl font-bold text-green-900">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="font-body text-base leading-relaxed text-green-700/90">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionCta({ title, description, primary, secondary }: Extract<ContentSection, { type: "cta" }>) {
  return (
    <section className="section-padding bg-gradient-to-br from-green-800 to-green-900 text-cream-50">
      <div className="container max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-extrabold">{title}</h2>
        <p className="mt-4 font-body text-lg text-cream-100/90">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={primary.href}
            className="motion-button inline-flex h-12 items-center justify-center rounded-full bg-terra-500 px-8 text-sm font-semibold text-white shadow-clay hover:bg-terra-600"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex h-12 items-center justify-center rounded-full border border-cream-100/30 px-8 text-sm font-semibold text-cream-50 transition hover:bg-cream-50/10"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RelatedLinks({ links }: { links: ContentPage["relatedLinks"] }) {
  if (!links?.length) return null;
  return (
    <section className="border-t border-green-100 bg-cream-50 py-10">
      <div className="container">
        <h2 className="font-heading text-lg font-bold text-green-900">Related pages</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-800 transition hover:border-green-400 hover:text-green-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ContentPageRenderer({ page }: { page: ContentPage }) {
  return (
    <>
      {page.sections.map((section, index) => {
        switch (section.type) {
          case "intro":
            return <SectionIntro key={`intro-${index}`} {...section} />;
          case "cards":
            return <SectionCards key={`cards-${index}`} {...section} />;
          case "imageSplit":
            return <SectionImageSplit key={`split-${index}`} {...section} />;
          case "timeline":
            return <SectionTimeline key={`timeline-${index}`} {...section} />;
          case "trustBadges":
            return <SectionTrustBadges key={`trust-${index}`} {...section} />;
          case "stats":
            return <SectionStats key={`stats-${index}`} {...section} />;
          case "faq":
            return <FaqAccordion key={`faq-${index}`} items={section.items} title={section.title} />;
          case "legal":
            return <SectionLegal key={`legal-${index}`} {...section} />;
          case "contact":
            return <ContactFormSection key={`contact-${index}`} />;
          case "cta":
            return <SectionCta key={`cta-${index}`} {...section} />;
          case "researchProcess":
            return <ResearchProcessSection key={`research-process-${index}`} compact={section.compact} />;
          case "ingredientTransparency":
            return (
              <IngredientTransparency key={`ingredients-${index}`} limit={section.limit} />
            );
          case "qualityStandards":
            return <QualityStandardsGrid key={`quality-${index}`} compact={section.compact} />;
          case "doctorAdvisory":
            return <DoctorAdvisorySection key={`advisory-${index}`} compact={section.compact} />;
          case "manufacturingStory":
            return <ManufacturingStory key={`mfg-story-${index}`} />;
          case "sustainability":
            return <SustainabilitySection key={`sustainability-${index}`} />;
          case "trustWidgets":
            return <TrustWidgets key={`widgets-${index}`} variant={section.variant} />;
          default:
            return null;
        }
      })}
      <RelatedLinks links={page.relatedLinks} />
    </>
  );
}
