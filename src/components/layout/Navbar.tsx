"use client";

import { useCallback, useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";

import Logo from "@/components/brand/Logo";
import CustomerUserMenu from "@/components/layout/CustomerUserMenu";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { isCustomerAuthPath } from "@/lib/routes";
import {
  badgeCount,
  dialogOverlay,
  drawerPanel,
  focusRing,
  headerIconBtn,
  headerNavLink,
  navGlass,
  siteNavbar,
} from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const HeaderSearch = dynamic(() => import("@/components/layout/HeaderSearch"), {
  ssr: false,
  loading: () => (
    <div className="icon-btn h-10 w-10 animate-pulse rounded-full bg-green-100/60" aria-hidden="true" />
  ),
});

const SECTION_IDS = ["home", "products", "about", "research", "contact"] as const;

const NAV_ITEMS: { label: string; href: string; sectionId: string }[] = [
  { label: "Home", href: "/", sectionId: "home" },
  { label: "Products", href: "/products", sectionId: "products" },
  { label: "About", href: "/about", sectionId: "about" },
  { label: "Research", href: "/research", sectionId: "research" },
  { label: "Contact", href: "/contact", sectionId: "contact" },
];

const INSTAGRAM_URL = "https://instagram.com/beyondbabyco";

function scrollToSection(id: string) {
  if (id === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const NavLink = memo(function NavLink({
  item,
  isActive,
  onNavigate,
  className,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <a
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => {
        if (window.location.pathname === "/") {
          e.preventDefault();
          scrollToSection(item.sectionId);
          onNavigate?.();
        }
      }}
      className={cn(
        headerNavLink,
        "header-nav-link",
        focusRing,
        "rounded-sm px-0.5",
        isActive ? "text-green-900" : "text-green-700 hover:text-green-900",
        className,
      )}
    >
      <span>{item.label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "header-nav-underline",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80",
        )}
      />
    </a>
  );
});

const CartNavButton = memo(function CartNavButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const cart = useCartOptional();
  const cartUi = useCartUiOptional();
  const count = cart?.count ?? 0;

  return (
    <button
      type="button"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      title="Cart"
      onClick={() => {
        cartUi?.setMiniCartOpen(true);
        onClick?.();
      }}
      className={cn(headerIconBtn, focusRing, className)}
    >
      <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
      {count > 0 ? (
        <span className={cn(badgeCount, "absolute -right-0.5 -top-0.5 min-h-5 min-w-5 px-1 text-[10px]")}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
});

function HeaderIconLink({
  href,
  label,
  children,
  onClick,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(headerIconBtn, focusRing, "relative")}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const activeSection = useActiveSection(SECTION_IDS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (pathname?.startsWith("/admin") || isCustomerAuthPath(pathname)) {
    return null;
  }

  return (
    <div className={cn(siteNavbar, "px-3 sm:px-4 lg:px-5")}>
      <div
        className={cn(
          "site-navbar-inner site-navbar-grid mx-auto max-w-[1240px] min-h-[4.375rem] rounded-[1.75rem] px-2 py-2.5 transition-[padding,box-shadow,background] duration-[220ms] ease-[var(--ease-out)] lg:min-h-[4.625rem] lg:px-3 lg:py-3",
          navGlass,
        )}
      >
        <div className="site-navbar-logo site-logo-wrap shrink-0">
          <Logo size="nav" priority />
        </div>

        <nav
          aria-label="Main navigation"
          className="site-navbar-nav hidden items-center gap-12 lg:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.sectionId}
              item={item}
              isActive={
                pathname === item.href ||
                (pathname === "/" && activeSection === item.sectionId)
              }
            />
          ))}
        </nav>

        <div className="site-navbar-actions flex items-center gap-1.5 lg:gap-1.5">
          <HeaderSearch onNavigate={closeDrawer} />
          <span className="hidden lg:contents">
            <HeaderIconLink href="/wishlist" label="Wishlist">
              <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
            </HeaderIconLink>
          </span>
          <CartNavButton />
          <div className="mx-0.5 hidden h-6 w-px bg-green-200/80 lg:block" aria-hidden="true" />
          <span className="hidden lg:contents">
            <CustomerUserMenu />
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BeyondBabyCo on Instagram"
              title="Instagram"
              className={cn(headerIconBtn, focusRing)}
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
          </span>

          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                className={cn(
                  headerIconBtn,
                  "border border-green-200/70 bg-white/85 shadow-sm lg:hidden",
                  focusRing,
                )}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay
                className={cn(
                  dialogOverlay,
                  "fixed inset-0 z-[60] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
                )}
              />
              <Dialog.Content
                id="mobile-nav-drawer"
                aria-describedby={undefined}
                className={cn(
                  drawerPanel,
                  "fixed inset-y-0 right-0 z-[70] flex w-full max-w-[min(100vw,22rem)] flex-col pb-[env(safe-area-inset-bottom)] outline-none",
                  "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
                )}
              >
                <div className="flex items-center justify-between border-b border-green-100/80 px-5 py-4">
                  <Dialog.Title className="sr-only">Mobile navigation</Dialog.Title>
                  <Logo size="nav" href={null} />
                  <Dialog.Close asChild>
                    <button type="button" aria-label="Close navigation menu" className={cn(headerIconBtn, focusRing)}>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
                  <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.sectionId}
                        item={item}
                        isActive={
                          pathname === item.href ||
                          (pathname === "/" && activeSection === item.sectionId)
                        }
                        onNavigate={closeDrawer}
                        className="rounded-2xl px-4 py-4 text-base"
                      />
                    ))}
                  </nav>

                  <div className="mt-6">
                    <CustomerUserMenu compact onNavigate={closeDrawer} />
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-green-100/80 bg-cream-50/95 px-5 py-4 backdrop-blur-md">
                  <Link
                    href="/products"
                    onClick={closeDrawer}
                    className="flex min-h-[52px] items-center justify-center rounded-full bg-green-600 font-body text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
                  >
                    Shop Collection
                  </Link>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white/80 font-body text-sm font-medium text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
                  >
                    <InstagramIcon className="h-4 w-4" />
                    Follow on Instagram
                  </a>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
}
