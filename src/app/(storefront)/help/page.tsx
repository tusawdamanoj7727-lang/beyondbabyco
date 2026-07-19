import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import { HELP_CATEGORIES, HELP_FAQ_ITEMS } from "@/lib/content/help";
import { brandSupportEmail, brandWhatsAppDisplay, brandWhatsAppUrl } from "@/lib/brand/contact";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Help Center",
  description:
    "BeyondBabyCo Help Center — ordering, payments, shipping, delivery, returns, refunds, tracking, and product care.",
  path: "/help",
  keywords: ["BeyondBabyCo help", "shipping", "returns", "order tracking", "customer support"],
});

export default function HelpCenterPage() {
  const faqSchema = faqJsonLd(HELP_FAQ_ITEMS.map(({ question, answer }) => ({ question, answer })));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Help Center" },
          ]),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <div className="min-h-screen bg-brand-cream pb-16">
        <header className="border-b border-green-100 bg-gradient-to-b from-white to-cream-50">
          <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <p className="text-eyebrow text-terra-600">Customer support</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-green-900 sm:text-5xl">Help Center</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-green-800">
              Answers for ordering, payments, shipping, returns, and product care. Still stuck? Email{" "}
              <a className="font-semibold text-terra-700 underline-offset-2 hover:underline" href={`mailto:${brandSupportEmail()}`}>
                {brandSupportEmail()}
              </a>{" "}
              or WhatsApp{" "}
              <a
                className="font-semibold text-terra-700 underline-offset-2 hover:underline"
                href={brandWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {brandWhatsAppDisplay()}
              </a>
              . We aim to reply within one business day.
            </p>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl space-y-12 px-4 py-10">
          <section aria-labelledby="help-topics-heading">
            <h2 id="help-topics-heading" className="font-heading text-xl font-bold text-green-900">
              Browse topics
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {HELP_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#${cat.id}`}
                    className="block h-full rounded-2xl border border-green-100 bg-white p-4 shadow-sm hover:border-green-200"
                  >
                    <p className="font-semibold text-green-900">{cat.title}</p>
                    <p className="mt-1 text-sm text-green-700">{cat.description}</p>
                    <span className="mt-2 inline-block text-xs font-semibold text-terra-600">
                      Jump to answers →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {HELP_CATEGORIES.map((cat) => {
            const items = HELP_FAQ_ITEMS.filter((f) => f.category === cat.id);
            if (!items.length) return null;
            return (
              <section key={cat.id} id={cat.id} aria-labelledby={`${cat.id}-heading`} className="scroll-mt-28">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <h2 id={`${cat.id}-heading`} className="font-heading text-xl font-bold text-green-900">
                    {cat.title}
                  </h2>
                  {cat.href ? (
                    <Link href={cat.href} className="text-sm font-semibold text-terra-600 hover:underline">
                      Full policy / page →
                    </Link>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {items.map((faq) => (
                    <details
                      key={faq.question}
                      className="group rounded-2xl border border-green-100 bg-white p-5 shadow-sm open:shadow-md"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-green-900 marker:hidden [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-4">
                          {faq.question}
                          <span className="text-terra-600 transition-transform group-open:rotate-45">+</span>
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-green-700">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}

          <nav
            aria-label="Help related links"
            className="rounded-3xl border border-green-100 bg-white p-6"
          >
            <h2 className="font-heading text-lg font-bold text-green-900">More resources</h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Track order", href: "/track-order" },
                { label: "Contact", href: "/contact" },
                { label: "Learn hub", href: "/learn" },
                { label: "Ingredients", href: "/ingredients" },
                { label: "Trust Center", href: "/trust-center" },
                { label: "Shipping policy", href: "/shipping-policy" },
                { label: "Refund policy", href: "/refund-policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-10 items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:border-green-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
