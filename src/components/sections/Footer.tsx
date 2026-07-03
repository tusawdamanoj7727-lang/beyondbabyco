"use client";

import Link from "next/link";
import { Globe, Leaf, ShieldCheck } from "lucide-react";

import MotionSection from "../ui/MotionSection";
import Reveal from "../ui/Reveal";
import AccentBar from "../ui/AccentBar";
import Logo from "@/components/brand/Logo";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Mascot, type MascotPose, type MascotType } from "../mascots";
import { ALL_MASCOTS, mascotFloatDuration, mascotLabel } from "../../lib/mascots";
import { brandSupportEmail } from "@/lib/brand/contact";
import { FOOTER as FOOTER_COPY } from "@/lib/brand/copy";
import type { FooterConfig } from "@/lib/admin/homepage-schema";
import { focusRing, trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/our-story" },
  { label: "Research", href: "/research" },
  { label: "Contact", href: "/contact" },
];

const COMPANY_LINKS: { label: string; href: string }[] = [
  { label: "Trust Center", href: "/trust-center" },
  { label: "Why BeyondBabyCo", href: "/why-beyondbabyco" },
  { label: "Ingredients", href: "/ingredients" },
  { label: "Manufacturing", href: "/manufacturing" },
  { label: "Certifications", href: "/certifications" },
  { label: "Safety Standards", href: "/safety-standards" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "FAQ", href: "/faq" },
];

const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Cookies", href: "/cookies" },
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

export default function Footer({ cms }: { cms?: FooterConfig }) {
  const companyInfo = cms?.companyInfo?.trim() || FOOTER_COPY.companyInfo;
  const email = cms?.email?.trim() || brandSupportEmail();
  const phone = cms?.phone?.trim();
  const address = cms?.address?.trim() || "Udaipur, Rajasthan, India";
  const copyright =
    cms?.copyright?.trim() || "© 2026 BeyondBabyCo. All Rights Reserved.";
  const socialLinks = cms?.social?.filter((s) => s.url.trim()) ?? [];

  return (
    <footer id="contact" className="homepage-footer relative overflow-hidden">
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
                    <FooterLink href={item.href} className={linkClass}>
                      {item.label}
                    </FooterLink>
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
                {phone ? (
                  <div>
                    <p className="font-semibold text-green-900">Phone</p>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className={linkClass}>
                      {phone}
                    </a>
                  </div>
                ) : null}
                <div>
                  <p className="mb-2.5 font-semibold text-green-900">Follow Us</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.length > 0 ? (
                      socialLinks.map((link) => (
                        <a
                          key={`${link.platform}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "icon-btn border border-green-200 bg-white text-green-700 hover:border-green-300 hover:bg-green-50",
                            focusRing,
                          )}
                          aria-label={link.platform}
                        >
                          <InstagramIcon className="h-[18px] w-[18px]" />
                        </a>
                      ))
                    ) : (
                      <a
                        href="https://instagram.com/beyondbabyco"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "icon-btn border border-green-200 bg-white text-green-700 hover:border-green-300 hover:bg-green-50",
                          focusRing,
                        )}
                        aria-label="BeyondBabyCo on Instagram"
                      >
                        <InstagramIcon className="h-[18px] w-[18px]" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-green-900">Support</p>
                  <p className="mt-0.5">Monday–Saturday · 10 AM – 6 PM</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <FooterLink href="/contact" className={linkBtn}>
                  Contact Us
                </FooterLink>
                <FooterLink href="/#newsletter" className={cn(linkClass, "inline-flex h-11 items-center font-semibold text-green-800")}>
                  Join our newsletter →
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
                  size={index % 2 === 0 ? 96 : 88}
                  animated
                  floating={false}
                  interactive
                  className="homepage-footer-mascot"
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
