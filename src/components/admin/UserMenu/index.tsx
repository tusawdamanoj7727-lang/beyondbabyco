"use client";

import { useEffect, useRef, useState } from "react";

import Icon from "../Icon";
import { initialsFrom, useAdmin } from "../context";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { useRole } from "@/lib/auth/hooks";

export default function UserMenu() {
  const { user, role: initialRole } = useAdmin();
  const { role: liveRole, loading } = useRole();
  const role = loading ? initialRole : liveRole;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const displayName = user.fullName || user.email || "Staff member";
  const roleLabel = role ? ROLE_LABELS[role] : "Staff";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-2xl border border-cream-300 bg-cream-50 py-1 pl-1 pr-2.5 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-green-500 text-xs font-bold text-cream-50">
          {initialsFrom(user)}
        </span>
        <span className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="max-w-[120px] truncate text-xs font-semibold text-green-900">
            {displayName}
          </span>
          <span className="text-[11px] text-green-700/60">{roleLabel}</span>
        </span>
        <span className="text-green-700/50">
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="User menu"
          className="animate-dropdown-in absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-clay"
        >
            <div className="flex items-center gap-3 border-b border-cream-200 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500 text-sm font-bold text-cream-50">
                {initialsFrom(user)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-green-900">{displayName}</p>
                <p className="truncate text-xs text-green-700/60">{user.email}</p>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                role="menuitem"
                disabled
                title="Profile page coming soon"
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-green-700/45"
              >
                <Icon name="user" size={18} />
                Profile
              </button>

              <form action="/admin/logout" method="post" role="none">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-terra-600 transition-colors hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                >
                  <Icon name="logout" size={18} />
                  Log out
                </button>
              </form>
            </div>
        </div>
      ) : null}
    </div>
  );
}
