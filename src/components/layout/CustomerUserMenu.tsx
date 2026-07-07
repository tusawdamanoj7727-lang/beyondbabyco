"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  User,
} from "lucide-react";

import { initialsFromName, useCustomerAuth } from "@/lib/auth/customer-hooks";
import { cn } from "@/lib/utils";
import { focusRing, motionButton, transitionColorsFast } from "@/lib/design/ui";

const AccountDropdownPanel = dynamic(
  () => import("@/components/layout/CustomerUserMenuPanel"),
  { ssr: false },
);

type CustomerUserMenuProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

export default function CustomerUserMenu({ compact = false, onNavigate }: CustomerUserMenuProps) {
  const { user, profile, displayName, loading } = useCustomerAuth();
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

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "animate-pulse rounded-full bg-green-100",
          compact ? "h-11 w-full" : "h-10 w-28",
        )}
      />
    );
  }

  if (!user) {
    if (compact) {
      return (
        <div className="space-y-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className={cn(
              "flex min-h-[52px] w-full items-center justify-center rounded-full font-body text-sm font-semibold",
              motionButton,
              "bg-green-600 text-cream-50 shadow-sm hover:bg-green-700",
              focusRing,
            )}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={onNavigate}
            className={cn(
              "flex min-h-[52px] w-full items-center justify-center rounded-full border border-green-200 bg-white font-body text-sm font-semibold text-green-800",
              transitionColorsFast,
              "hover:bg-green-50",
              focusRing,
            )}
          >
            Create Account
          </Link>
        </div>
      );
    }

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={open}
        className={cn(
          "flex min-h-[44px] items-center gap-2 rounded-full border border-green-200/80 bg-white/85 px-3 py-1.5 backdrop-blur-md",
          transitionColorsFast,
          "hover:bg-white",
          focusRing,
        )}
        >
          <User className="h-[18px] w-[18px] text-green-700" aria-hidden="true" />
          <span className="text-sm font-medium text-green-900">Account</span>
          <ChevronDown
            className={cn("h-4 w-4 text-green-700/60 transition-transform duration-200", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {open ? (
          <AccountDropdownPanel
            guest
            onClose={() => setOpen(false)}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>
    );
  }

  const initials = initialsFromName(displayName);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex min-h-[44px] items-center gap-2 rounded-full border border-green-200/80 bg-white/85 py-1 pl-1 pr-2.5 backdrop-blur-md",
          transitionColorsFast,
          "hover:bg-white",
          focusRing,
          compact && "w-full pr-3",
        )}
      >
        {profile?.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={36}
            height={36}
            sizes="36px"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-600 text-xs font-bold text-cream-50">
            {initials}
          </span>
        )}
        {!compact ? (
          <span className="hidden max-w-[108px] truncate text-sm font-medium leading-none text-green-900 sm:inline">
            {displayName}
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-none text-green-900">{displayName}</span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-green-700/60 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <AccountDropdownPanel
          guest={false}
          displayName={displayName}
          email={user.email ?? ""}
          onSignOut={() => {
            setOpen(false);
            onNavigate?.();
          }}
          onClose={() => setOpen(false)}
          onNavigate={onNavigate}
        />
      ) : null}
    </div>
  );
}
