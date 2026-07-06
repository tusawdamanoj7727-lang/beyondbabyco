"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import Icon from "../Icon";
import { AdminProvider, type AdminContextValue } from "../context";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "bb-admin-sidebar-collapsed";

export default function Shell({
  value,
  children,
}: {
  value: AdminContextValue;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore persisted desktop collapse preference after mount.
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <AuthProvider>
      <ToastProvider>
      <AdminProvider value={value}>
      <div className="flex h-screen w-full overflow-hidden bg-cream-100">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 border-r border-cream-300 transition-[width] duration-300 ease-[var(--ease-out)] lg:block",
            collapsed ? "w-[76px]" : "w-[280px]",
          )}
        >
          <Sidebar collapsed={collapsed} />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onOpenDrawer={() => setMobileOpen(true)}
          />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="animate-drawer-backdrop-in absolute inset-0 bg-green-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="animate-drawer-panel-in absolute left-0 top-0 h-full w-[280px] max-w-[85vw] border-r border-cream-300 shadow-clay"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-2xl bg-cream-100 text-green-800 transition-colors hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              <Icon name="close" size={18} />
            </button>
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      </AdminProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
