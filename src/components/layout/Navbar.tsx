"use client";

import Link from "next/link";
import { Heart, Menu, ShoppingBag, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

import StaticSvgImage from "@/components/media/StaticSvgImage";
import { HEADER_ACCOUNT_HREF, PRIMARY_NAV_LINKS } from "@/lib/brand/navigation";
import { INSTAGRAM_URL } from "@/lib/brand/social";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import { isCustomerAuthPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ICON_LINK =
  "relative flex h-11 w-11 shrink-0 items-center justify-center text-gray-600 transition-colors";

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
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const hydrated = useCartHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const count = hydrated ? itemCount : 0;

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const runAuth = () => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = sub;
    };

    if (typeof requestIdleCallback !== "undefined") {
      idleHandle = requestIdleCallback(runAuth, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(runAuth, 0);
    }

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
      subscription?.unsubscribe();
      if (idleHandle !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
          <Link href="/" className="site-navbar-logo shrink-0" aria-label="BeyondBabyCo home">
            <StaticSvgImage
              src="/images/brand/logo.svg"
              alt="BeyondBabyCo"
              width={160}
              height={52}
              loading="eager"
              className="h-10 w-auto md:h-12"
            />
          </Link>

          <div
            aria-label="Main navigation"
            className="site-navbar-nav hidden shrink-0 items-center gap-6 lg:flex xl:gap-8"
          >
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-gray-600 transition-colors hover:text-[#2d5a27]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#2d5a27] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="site-navbar-actions flex items-center justify-end gap-1 sm:gap-2 md:gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={cn(ICON_LINK, "hover:text-[#c4673a]")}
            >
              <InstagramIcon />
            </a>

            <Link href="/wishlist" aria-label="Wishlist" className={cn(ICON_LINK, "hover:text-[#c4673a]")}>
              <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>

            <Link
              href={HEADER_ACCOUNT_HREF}
              aria-label="My Account"
              className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
            >
              <UserCircle
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
                className={user ? "text-[#2d5a27]" : undefined}
              />
              {user ? (
                <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#2d5a27]" />
              ) : null}
            </Link>

            <Link
              href="/cart"
              aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
              className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#c4673a] text-[10px] font-bold text-white">
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
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 transform bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          <span className="text-sm font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
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
              className="block rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2d5a27]"
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
              className={cn(ICON_LINK, "hover:text-[#c4673a]")}
            >
              <InstagramIcon />
            </a>
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              aria-label="Wishlist"
              className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
            >
              <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href={HEADER_ACCOUNT_HREF}
              onClick={() => setMobileOpen(false)}
              aria-label="My Account"
              className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
            >
              <UserCircle size={22} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              aria-label="Cart"
              className={cn(ICON_LINK, "hover:text-[#2d5a27]")}
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </nav>
  );
}

export default Navbar;
