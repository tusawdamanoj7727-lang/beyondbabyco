"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  User,
} from "lucide-react";

import OAuthButtons from "@/components/auth/OAuthButtons";
import { useCustomerAuth } from "@/lib/auth/customer-hooks";
import { cn } from "@/lib/utils";
import { focusRing, headerAccountPanel, motionButton, transitionColorsFast } from "@/lib/design/ui";

type AccountDropdownPanelProps = {
  guest: boolean;
  displayName?: string;
  email?: string;
  onClose: () => void;
  onNavigate?: () => void;
  onSignOut?: () => void;
};

export default function AccountDropdownPanel({
  guest,
  displayName = "",
  email = "",
  onClose,
  onNavigate,
  onSignOut,
}: AccountDropdownPanelProps) {
  const { signOut } = useCustomerAuth();

  function navigate() {
    onClose();
    onNavigate?.();
  }

  return (
    <motion.div
      role="menu"
      aria-label={guest ? "Sign in options" : "Account menu"}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        headerAccountPanel,
        "absolute right-0 top-full z-[80] mt-2 w-[min(92vw,18.5rem)] overflow-hidden rounded-3xl",
      )}
    >
      {guest ? (
        <div className="p-3">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-green-700/65">Welcome</p>
          <Link
            href="/login"
            role="menuitem"
            onClick={navigate}
            className={cn(
              "mb-2 flex min-h-[44px] w-full items-center justify-center rounded-full font-body text-sm font-semibold",
              motionButton,
              "bg-green-600 text-cream-50 hover:bg-green-700",
              focusRing,
            )}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            role="menuitem"
            onClick={navigate}
            className={cn(
              "mb-3 flex min-h-[44px] w-full items-center justify-center rounded-full border border-green-200 bg-white font-body text-sm font-semibold text-green-800",
              transitionColorsFast,
              "hover:bg-green-50",
              focusRing,
            )}
          >
            Create Account
          </Link>
          <div className="space-y-2 border-t border-green-100 pt-3">
            <OAuthButtons compact />
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-green-100 px-4 py-3.5">
            <p className="truncate text-sm font-semibold text-green-900">{displayName}</p>
            <p className="truncate text-xs text-green-700/60">{email}</p>
          </div>

          <div className="p-2">
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-green-700/55">My Account</p>
            <MenuLink href="/account" icon={User} label="Dashboard" onNavigate={navigate} />
            <MenuLink href="/account/orders" icon={Package} label="Orders" onNavigate={navigate} />
            <MenuLink href="/wishlist" icon={Heart} label="Wishlist" onNavigate={navigate} />
            <MenuLink href="/account/addresses" icon={MapPin} label="Addresses" onNavigate={navigate} />
            <MenuLink href="/account/profile" icon={Settings} label="Settings" onNavigate={navigate} />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSignOut?.();
                signOut();
              }}
              className="mt-1 flex w-full min-h-[44px] items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-terra-600 transition-colors hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              Logout
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
    >
      <Icon className="h-[18px] w-[18px] text-green-600" aria-hidden="true" />
      {label}
    </Link>
  );
}
