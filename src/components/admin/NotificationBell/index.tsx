"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import Icon from "../Icon";

export default function NotificationBell() {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-2xl border border-cream-300 bg-cream-50 text-green-800 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        <Icon name="bell" size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-clay"
          >
            <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
              <p className="font-heading text-sm font-bold text-green-900">Notifications</p>
            </div>
            <div className="px-4 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-green-600">
                <Icon name="bell" size={22} />
              </span>
              <p className="mt-3 font-heading text-sm font-bold text-green-900">All caught up</p>
              <p className="mt-1 text-xs text-green-700/60">
                Operational alerts appear on the dashboard and Operations page. In-app notifications will arrive in a future release.
              </p>
              <Link
                href="/admin/operations"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex text-xs font-semibold text-terra-600 hover:underline"
              >
                View operations health
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
