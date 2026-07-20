"use client";

import Link from "next/link";
import { Heart, Menu, ShoppingBag, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import Logo from "@/components/brand/Logo";
import { handleFocusTrap, lockBodyScroll } from "@/lib/a11y/dialog-a11y";
import { useAuth } from "@/lib/auth/hooks";
import { HEADER_ACCOUNT_HREF, PRIMARY_NAV_LINKS } from "@/lib/brand/navigation";
import { INSTAGRAM_URL } from "@/lib/brand/social";
import {
  badgeCount,
  drawerPanel,
  focusRing,
  headerIconBtn,
  headerNavLink,
  siteNavbar,
  siteNavbarScrolled,
} from "@/lib/design/ui";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import { isCustomerAuthPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ICON_LINK = cn(headerIconBtn, "relative shrink-0", focusRing);

const NAV_LINK = cn(headerNavLink, "text-green-700 hover:text-green-900", focusRing);

const MOBILE_NAV_LINK = cn(
  "block rounded-xl px-4 py-3.5 text-[0.9375rem] font-medium tracking-[-0.01em] text-green-900 transition-colors duration-[var(--duration-button)] hover:bg-green-50",
  focusRing,
);

function InstagramIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hydrated = useCartHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const count = hydrated ? itemCount : 0;

  useEffect(() => {
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.setAttribute("data-scroll-sentinel", "1");
    sentinel.style.cssText =
      "position:absolute;top:0;left:0;width:1px;height:20px;pointer-events:none;visibility:hidden";
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        if (next === scrolledRef.current) return;
        scrolledRef.current = next;
        setScrolled(next);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
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
    const panel = panelRef.current;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (panel) handleFocusTrap(panel, e);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  if (pathname?.startsWith("/admin") || isCustomerAuthPath(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Site navigation"
      className={cn(
        siteNavbar,
        "w-full bg-green-50/95",
        scrolled && siteNavbarScrolled,
      )}
    >
      <div className="container">
        <div className="site-navbar-grid h-[4.5rem] md:h-[5.25rem]">
          <div className="site-navbar-logo site-logo-wrap flex shrink-0 items-center">
            <Logo size="nav" priority className="site-navbar-logo-img" />
          </div>

          <div
            aria-label="Main navigation"
            className="site-navbar-nav hidden shrink-0 items-center gap-6 lg:flex xl:gap-8"
          >
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK}>
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-green-700 transition-all duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="site-navbar-actions flex items-center justify-end gap-1 sm:gap-2">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={cn(ICON_LINK, "hidden sm:inline-flex")}
            >
              <InstagramIcon />
            </a>

            <Link href="/wishlist" aria-label="Wishlist" className={ICON_LINK}>
              <Heart className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
            </Link>

            <Link href={HEADER_ACCOUNT_HREF} aria-label="My Account" className={ICON_LINK}>
              <UserCircle
                className={cn("h-[1.125rem] w-[1.125rem]", user && "text-green-800")}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {user ? (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-cream-50 bg-green-600" />
              ) : null}
            </Link>

            <Link
              href="/cart"
              aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
              className={ICON_LINK}
            >
              <ShoppingBag className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
              {count > 0 ? (
                <span className={cn(badgeCount, "absolute right-0 top-0 bg-terra-500 text-white")}>
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(ICON_LINK, "lg:hidden")}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "fixed inset-0 z-40 bg-green-950/50 backdrop-blur-[2px] lg:hidden",
            focusRing,
          )}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        ref={panelRef}
        id="mobile-nav-panel"
        role="dialog"
        aria-modal={mobileOpen || undefined}
        aria-label="Mobile navigation menu"
        hidden={!mobileOpen}
        className={cn(
          drawerPanel,
          "fixed inset-y-0 right-0 z-50 flex w-[min(20.5rem,calc(100vw-1.25rem))] max-w-full transform flex-col transition-transform duration-[var(--duration-drawer)] ease-[var(--ease-out)] lg:hidden",
          mobileOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        {mobileOpen ? (
          <>
            <div className="flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-green-100/80 px-4">
              <Logo size="nav" href="/" />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className={cn(ICON_LINK, "h-10 w-10")}
                aria-label="Close menu"
              >
                <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-5"
              aria-label="Mobile navigation"
            >
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
            </nav>
            <div className="shrink-0 border-t border-green-100/80 px-5 py-4">
              <p className="text-xs leading-relaxed text-green-700/70">
                Premium baby care · Dermatologically tested
              </p>
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
