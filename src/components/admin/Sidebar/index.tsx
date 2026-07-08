"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Icon from "../Icon";
import Mascot from "@/components/mascots/Mascot";
import { NAV_SECTIONS, canSeeNavItem, type NavItem } from "../nav";
import { useAdminNavAuth } from "@/lib/auth/use-admin-nav-auth";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "/admin";
  const { role, hasPermission } = useAdminNavAuth();

  const can = (item: NavItem) => canSeeNavItem(item, role, hasPermission);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center gap-3 border-b border-cream-300 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          aria-label="BeyondBabyCo Admin home"
          className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cream-100 ring-1 ring-cream-300">
            <Mascot mascot="bella-bunny" pose="welcome" size={30} />
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-bold text-green-900">
                BeyondBabyCo
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-green-600">
                Admin
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Admin"
        className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]"
      >
        {NAV_SECTIONS.map((section, i) => {
          const visibleItems = section.items.filter(can);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title ?? `s-${i}`} className={cn(i > 0 && "mt-5")}>
              {section.title && !collapsed && (
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/40">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && i > 0 && (
                <div className="mx-3 mb-3 border-t border-cream-300" aria-hidden="true" />
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(pathname, item.href);

                  if (item.soon) {
                    return (
                      <li key={item.href}>
                        <span
                          title={collapsed ? item.label : "Coming soon"}
                          aria-disabled="true"
                          className={cn(
                            "relative flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-green-700/45",
                            collapsed && "justify-center px-0",
                          )}
                        >
                          <span className="shrink-0 opacity-60">
                            <Icon name={item.icon} size={20} />
                          </span>
                          {!collapsed && (
                            <>
                              <span className="truncate">{item.label}</span>
                              <span className="ml-auto rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700/60">
                                Soon
                              </span>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)]",
                          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-green-500 text-cream-50 shadow-clay"
                            : "text-green-800 hover:bg-green-50",
                        )}
                      >
                        <span className="shrink-0">
                          <Icon name={item.icon} size={20} />
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {active && !collapsed && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cream-50/90" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-cream-300 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "View store" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-green-700/70 transition-colors hover:bg-green-50 hover:text-green-900",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
            collapsed && "justify-center px-0",
          )}
        >
          <Icon name="external" size={20} />
          {!collapsed && <span>View store</span>}
        </Link>
      </div>
    </div>
  );
}
