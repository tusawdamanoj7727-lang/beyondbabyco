"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Menu, ShoppingBag, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { lockBodyScroll } from "@/lib/a11y/dialog-a11y";
import { useAuth } from "@/lib/auth/hooks";
import { BRAND_LOGO_ALT, BRAND_LOGO_PATH } from "@/lib/brand/logo";
import { HEADER_ACCOUNT_HREF, PRIMARY_NAV_LINKS } from "@/lib/brand/navigation";
import { INSTAGRAM_URL } from "@/lib/brand/social";
import { focusRing } from "@/lib/design/ui";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import { isCustomerAuthPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ICON_LINK = cn(
  "relative flex h-11 w-11 shrink-0 items-center justify-center text-gray-600 transition-colors",
  focusRing,
);

const NAV_LINK = cn(
  "group relative rounded text-sm font-medium text-gray-600 transition-colors hover:text-brand-forest",
  focusRing,
);

const MOBILE_NAV_LINK = cn(
  "block rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-forest",
  focusRing,
);

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const hydrated = useCartHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const count = hydrated ? itemCount : 0;

  useEffect(() => {
    let ticking = false;
    const syncScrolled = () => {
      const next = window.scrollY > 20;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncScrolled();
      });
    };
    syncScrolled();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    return lockBodyScroll();
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (pathname?.startsWith("/admin") || isCustomerAuthPath(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Site navigation"
      className={cn(
        "site-navbar w-full bg-white transition-shadow duration-300",
        scrolled && "shadow-sm",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="site-navbar-grid h-16 md:h-20">
          <Link href="/" className={cn("site-navbar-logo flex h-11 min-w-11 shrink-0 items-center", focusRing)} aria-label="BeyondBabyCo home">
            <Image
              src={BRAND_LOGO_PATH}
              alt={BRAND_LOGO_ALT}
              width={160}
              height={52}
              priority
              sizes="160px"
              quality={75}
              className="h-10 w-auto md:h-12"
            />
          </Link>

          <div
            aria-label="Main navigation"
            className="site-navbar-nav hidden shrink-0 items-center gap-6 lg:flex xl:gap-8"
          >
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK}>
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-forest transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="site-navbar-actions flex items-center justify-end gap-1 sm:gap-2 md:gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={cn(ICON_LINK, "hover:text-brand-terra")}
            >
              <InstagramIcon />
            </a>

            <Link href="/wishlist" aria-label="Wishlist" className={cn(ICON_LINK, "hover:text-brand-terra")}>
              <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>

            <Link
              href={HEADER_ACCOUNT_HREF}
              aria-label="My Account"
              className={cn(ICON_LINK, "hover:text-brand-forest")}
            >
              <UserCircle
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
                className={user ? "text-brand-forest" : undefined}
              />
              {user ? (
                <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-forest" />
              ) : null}
            </Link>

            <Link
              href="/cart"
              aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
              className={cn(ICON_LINK, "hover:text-brand-forest")}
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-terra text-[10px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(ICON_LINK, "lg:hidden")}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className={cn("fixed inset-0 z-40 bg-black/30 lg:hidden", focusRing)}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        id="mobile-nav-panel"
        role="dialog"
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Mobile navigation menu"
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : true}
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 transform bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          <span className="text-sm font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={cn(ICON_LINK, "hover:text-brand-forest")}
            aria-label="Close menu"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <nav className="space-y-1 px-4 py-4" aria-label="Mobile navigation">
          {PRIMARY_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={MOBILE_NAV_LINK}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              aria-label="Instagram"
              className={cn(ICON_LINK, "hover:text-brand-terra")}
            >
              <InstagramIcon />
            </a>
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              aria-label="Wishlist"
              className={cn(ICON_LINK, "hover:text-brand-forest")}
            >
              <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href={HEADER_ACCOUNT_HREF}
              onClick={() => setMobileOpen(false)}
              aria-label="My Account"
              className={cn(ICON_LINK, "hover:text-brand-forest")}
            >
              <UserCircle size={22} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
              className={cn(ICON_LINK, "hover:text-brand-forest")}
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-terra text-[10px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>
          </div>
        </nav>
      </div>
    </nav>
  );
}

export default Navbar;
