"use client";

import Link from "next/link";
import { type FormEvent } from "react";
import { Globe, Leaf, Loader2, ShieldCheck } from "lucide-react";

import MotionSection from "../ui/MotionSection";
import Reveal from "../ui/Reveal";
import AccentBar from "../ui/AccentBar";
import Logo from "@/components/brand/Logo";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import {
  formatSocialHandle,
  INSTAGRAM_ARIA_LABEL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  isInstagramSocialLink,
  isRawUrlLabel,
} from "@/lib/brand/social";
import { Mascot, type MascotPose, type MascotType } from "../mascots";
import { ALL_MASCOTS, mascotFloatDuration, mascotLabel } from "../../lib/mascots";
import {
  brandSupportEmail,
  brandSupportPhoneDisplay,
  brandSupportPhoneTel,
  brandWhatsAppDisplay,
  brandWhatsAppUrl,
  isWhatsAppConfigured,
} from "@/lib/brand/contact";
import { FOOTER as FOOTER_COPY } from "@/lib/brand/copy";
import { useNewsletterSubscribe } from "@/lib/newsletter/use-newsletter-subscribe";
import type { FooterConfig } from "@/lib/admin/homepage-schema";
import { focusRing, trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

type FooterNavItem =
  | { label: string; href: string }
  | { label: string; comingSoon: true };

const COMPANY_LINKS: FooterNavItem[] = [
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", comingSoon: true },
  { label: "Press", comingSoon: true },
];

const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const FOOTER_TRUST = [
  { icon: ShieldCheck, label: "Dermatologically tested" },
  { icon: Leaf, label: "Natural ingredients" },
  { icon: Globe, label: "Made in India" },
] as const;

const FOOTER_MASCOT_POSES: Record<MascotType, MascotPose> = {
  "bella-bunny": "wave",
  "gigi-giraffe": "welcome",
  "poppy-panda": "hug",
  "eli-elephant": "reading",
  "penny-penguin": "hold-product",
  "benny-bear": "celebration",
  "freddy-ferret": "celebration",
};

const linkClass =
  "motion-link font-body text-sm text-green-700/90 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 rounded";

const socialLinkClass = cn(
  linkClass,
  "inline-flex w-fit items-center gap-2 font-medium hover:text-[#2d5a27]",
);

const linkBtn =
  "inline-flex h-11 items-center justify-center rounded-full bg-green-700 px-6 text-sm font-semibold text-cream-50 shadow-[var(--shadow-premium)] hover:bg-green-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 motion-button";

function FooterLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function FooterNavItemRow({ item, className }: { item: FooterNavItem; className: string }) {
  if ("comingSoon" in item && item.comingSoon) {
    return (
      <span className="font-body text-sm text-green-700/55">
        {item.label}{" "}
        <span className="text-xs font-medium uppercase tracking-wide text-green-700/45">Coming Soon</span>
      </span>
    );
  }
  return (
    <FooterLink href={"href" in item ? item.href : "/"} className={className}>
      {item.label}
    </FooterLink>
  );
}

function FooterEmailCapture() {
  const { email, setEmail, status, msg, handleSubscribe } = useNewsletterSubscribe("footer");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubscribe(email);
  }

  return (
    <div className="relative overflow-visible bg-[#1a3a16] py-6">
      <div
        className="pointer-events-none absolute -bottom-1 left-2 z-20 hidden sm:block"
        aria-hidden="true"
      >
        <Mascot
          mascot="penny-penguin"
          pose="wave"
          size={110}
          animated
          floating
          interactive
          alt="Penny waving"
          className="relative z-20"
        />
      </div>
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:pl-28">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-white">Get exclusive baby care tips + launch offers</p>
          <p className="text-sm text-green-300">Join 2,000+ parents who trust BeyondBabyCo</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          noValidate
        >
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            disabled={status === "loading"}
            className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c4673a] sm:w-64"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#c4673a] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a8522e] disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Subscribing…
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>
      {msg ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={cn(
            "mx-auto mt-3 max-w-4xl px-4 text-center text-sm sm:text-left",
            status === "success" ? "text-green-300" : "text-red-300",
          )}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

export default function Footer({ cms }: { cms?: FooterConfig }) {
  const companyInfo = cms?.companyInfo?.trim() || FOOTER_COPY.companyInfo;
  const email = cms?.email?.trim() || brandSupportEmail();
  const phoneDisplay = cms?.phone?.trim() || (isWhatsAppConfigured() ? brandSupportPhoneDisplay() : "");
  const phoneTel =
    cms?.phone?.trim()?.replace(/\s/g, "") ||
    (isWhatsAppConfigured() ? brandSupportPhoneTel().replace(/\s/g, "") : "");
  const whatsappUrl = isWhatsAppConfigured() ? brandWhatsAppUrl() : null;
  const address = cms?.address?.trim() || "Udaipur, Rajasthan, India";
  const copyright =
    cms?.copyright?.trim() || "© 2026 BeyondBabyCo. All Rights Reserved.";
  const socialLinks = (cms?.social ?? []).filter(
    (s) =>
      s.url.trim() &&
      !isInstagramSocialLink(s.url, s.platform) &&
      !isRawUrlLabel(formatSocialHandle(s.url, s.platform)) &&
      !isRawUrlLabel(s.platform),
  );

  return (
    <footer id="contact" className="homepage-footer relative overflow-hidden">
      <FooterEmailCapture />
      <MotionSection as="div" variant="fadeUp" className="homepage-footer-inner relative z-10">
        <div className="container w-full">
          <div className="grid grid-cols-1 items-start gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-10">
            <Reveal as="div" variant="fadeUp" delay={0} className="w-full sm:col-span-2 lg:col-span-4">
              <div className="flex flex-col">
                <Logo size="footer" variant="default" />
                <AccentBar width="md" align="left" className="mt-4" />
                <p className="prose-measure mt-4 font-body text-sm leading-[1.72] text-green-800/88">
                  {companyInfo}
                </p>

                <div className="homepage-footer-trust mt-5" aria-label="Trust guarantees">
                  {FOOTER_TRUST.map(({ icon: Icon, label }) => (
                    <span key={label}>
                      <Icon aria-hidden="true" className={cn("icon-outline text-green-600", trustIconSize)} strokeWidth={1.75} />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2.5 font-body text-sm text-green-800/88">
                  <div>
                    <p className="font-semibold text-green-900">Parent Company</p>
                    <p className="mt-0.5">Tusawda Global Private Limited</p>
                  </div>
                  {address ? (
                    <div>
                      <p className="font-semibold text-green-900">Location</p>
                      <p className="mt-0.5">{address}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.1} className="w-full lg:col-span-2">
              <h3 className="footer-column-title">Quick Links</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {QUICK_LINKS.map((item) => (
                  <li key={item.label}>
                    <FooterLink href={item.href} className={linkClass}>
                      {item.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.2} className="w-full lg:col-span-3">
              <h3 className="footer-column-title">Company</h3>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {COMPANY_LINKS.map((item) => (
                  <li key={item.label}>
                    <FooterNavItemRow item={item} className={linkClass} />
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.25} className="w-full lg:col-span-3">
              <h3 className="footer-column-title">Legal & Support</h3>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.label}>
                    <FooterLink href={item.href} className={linkClass}>
                      {item.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal as="div" variant="fadeUp" delay={0.3} className="w-full lg:col-span-4">
              <h3 className="footer-column-title">Stay Connected</h3>
              <div className="mt-5 flex flex-col gap-4 font-body text-sm text-green-800/88">
                <div>
                  <p className="font-semibold text-green-900">Email</p>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </div>
                {phoneDisplay ? (
                  <div>
                    <p className="font-semibold text-green-900">Phone</p>
                    <a href={`tel:${phoneTel}`} className={linkClass}>
                      {phoneDisplay}
                    </a>
                  </div>
                ) : null}
                {whatsappUrl ? (
                  <div>
                    <p className="font-semibold text-green-900">WhatsApp</p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(linkClass, "inline-flex w-fit items-center gap-2 hover:text-[#128C7E]")}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0 text-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {brandWhatsAppDisplay()}
                    </a>
                  </div>
                ) : null}
                <div>
                  <p className="mb-2.5 font-semibold text-green-900">Follow Us</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={INSTAGRAM_ARIA_LABEL}
                      className={cn(socialLinkClass, focusRing)}
                    >
                      <InstagramIcon className="h-5 w-5 shrink-0" />
                      {INSTAGRAM_HANDLE}
                    </a>
                    {socialLinks.map((link) => {
                      const handle = formatSocialHandle(link.url, link.platform);
                      return (
                        <a
                          key={`${link.platform}-${link.url}`}
                          href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(socialLinkClass, focusRing)}
                        >
                          <span>{handle}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-green-900">Support</p>
                  <p className="mt-0.5">Monday–Saturday · 10 AM – 6 PM</p>
                </div>
              </div>

              <div className="mt-5">
                <FooterLink href="/contact" className={linkBtn}>
                  Contact Us
                </FooterLink>
              </div>
            </Reveal>
          </div>

          <Reveal as="div" variant="fadeUp" delay={0.35} className="mt-14 w-full">
            <p className="mb-6 text-center font-heading text-xs font-semibold uppercase tracking-[0.14em] text-green-700/65 lg:text-left">
              Our Mascot Family
            </p>
            <div
              className="homepage-footer-mascot-row flex flex-wrap items-center justify-center gap-5 sm:gap-6 lg:justify-between"
              aria-label="BeyondBabyCo mascot family"
            >
              {ALL_MASCOTS.map((mascot, index) => (
                <Mascot
                  key={mascot}
                  mascot={mascot}
                  pose={FOOTER_MASCOT_POSES[mascot]}
                  size={64}
                  animated
                  floating={false}
                  interactive
                  className="homepage-footer-mascot relative z-30"
                  duration={mascotFloatDuration(mascot)}
                  delay={index * 0.18}
                  alt={`${mascotLabel(mascot)} mascot`}
                />
              ))}
            </div>
          </Reveal>

          <div className="my-12 border-t border-green-200/60" />

          <Reveal as="div" variant="fadeUp" delay={0.4} className="w-full">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <p className="font-body text-sm text-green-800/82">{copyright}</p>
              <p className="font-body text-sm text-green-800/82">{FOOTER_COPY.madeWith}</p>
            </div>
          </Reveal>
        </div>
      </MotionSection>
    </footer>
  );
}
