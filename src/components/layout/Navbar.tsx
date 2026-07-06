"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, ShoppingBag, UserCircle, X } from "lucide-react";

import StaticSvgImage from "@/components/media/StaticSvgImage";

import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { useAuth } from "@/lib/auth/hooks";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import { isCustomerAuthPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const TERRACOTTA = "#c4673a";
const INSTAGRAM_URL = "https://instagram.com/beyondbabyco";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function NavLink({
  item,
  isActive,
  onNavigate,
  className,
}: {
  item: (typeof NAV_LINKS)[number];
  isActive: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative text-sm font-medium transition-colors duration-200",
        isActive ? "text-[#2d5a27]" : "text-gray-700 hover:text-[#2d5a27]",
        className,
      )}
    >
      {item.label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 rounded-full bg-[#2d5a27] transition-all duration-300 ease-out",
          isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100",
        )}
      />
    </Link>
  );
}

function BrandLogo({ className }: { className?: string }) {
  return (
    <StaticSvgImage
      src="/images/brand/logo.svg"
      alt="BeyondBabyCo"
      width={208}
      height={68}
      loading="eager"
      className={cn("h-[62px] w-auto object-contain", className)}
    />
  );
}

function SocialIcons({ onNavigate }: { onNavigate?: () => void }) {
  const hydrated = useCartHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const count = hydrated ? itemCount : 0;
  const { user } = useAuth();
  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "My Account" : "Login";
  const userInitial = user?.email?.[0]?.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        onClick={onNavigate}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
      >
        <InstagramIcon className="h-5 w-5" />
      </a>

      <Link
        href="/wishlist"
        aria-label="Wishlist"
        onClick={onNavigate}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
      >
        <Heart size={20} aria-hidden="true" />
      </Link>

      <Link
        href={accountHref}
        aria-label={accountLabel}
        onClick={onNavigate}
        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
      >
        <UserCircle
          size={22}
          strokeWidth={1.5}
          aria-hidden="true"
          className={cn(user ? "text-[#2d5a27]" : "text-gray-600")}
        />
        {userInitial ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c4673a] text-[10px] font-bold text-white">
            {userInitial}
          </span>
        ) : null}
        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {accountLabel}
        </span>
      </Link>

      <Link
        href="/cart"
        aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
        onClick={onNavigate}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
      >
        <ShoppingBag size={20} aria-hidden="true" />
        {count > 0 ? (
          <span
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: TERRACOTTA }}
            aria-hidden="true"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (pathname?.startsWith("/admin") || isCustomerAuthPath(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Site navigation"
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 font-[family-name:var(--font-montserrat)] backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* LEFT — Logo */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
          aria-label="BeyondBabyCo home"
        >
          <BrandLogo />
        </Link>

        {/* CENTER — desktop nav */}
        <div
          aria-label="Main navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex xl:gap-10"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isNavItemActive(pathname ?? "", item.href)}
            />
          ))}
        </div>

        {/* RIGHT — desktop icons */}
        <div className="hidden lg:block">
          <SocialIcons />
        </div>

        {/* MOBILE — hamburger */}
        <div className="lg:hidden">
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content
                id="mobile-nav-drawer"
                aria-describedby={undefined}
                className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[min(100vw,20rem)] flex-col border-l border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <Dialog.Title className="sr-only">Mobile navigation</Dialog.Title>
                  <BrandLogo />
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:text-[#2d5a27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a27]/30"
                    >
                      <X size={22} aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <nav
                  aria-label="Mobile navigation"
                  className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
                >
                  {NAV_LINKS.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={isNavItemActive(pathname ?? "", item.href)}
                      onNavigate={closeDrawer}
                      className="rounded-xl px-4 py-3.5 text-base"
                    />
                  ))}
                </nav>

                <div className="border-t border-gray-100 px-5 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Connect
                  </p>
                  <SocialIcons onNavigate={closeDrawer} />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </nav>
  );
}
