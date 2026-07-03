"use client";

import Icon from "../Icon";
import Breadcrumb from "../Breadcrumb";
import SearchBar from "../SearchBar";
import NotificationBell from "../NotificationBell";
import UserMenu from "../UserMenu";

export default function Topbar({
  collapsed,
  onToggleCollapse,
  onOpenDrawer,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center gap-3 border-b border-cream-300 bg-cream-50/90 px-3 backdrop-blur-md sm:px-5">
      {/* Mobile: open drawer */}
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cream-300 bg-white text-green-800 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 lg:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* Desktop: collapse toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cream-300 bg-white text-green-800 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 lg:grid"
      >
        <Icon name="panelLeft" size={20} />
      </button>

      <div className="hidden min-w-0 md:block">
        <Breadcrumb />
      </div>

      {/* Centered global search */}
      <div className="mx-auto w-full max-w-md">
        <SearchBar />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
