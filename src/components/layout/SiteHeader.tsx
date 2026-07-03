"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const HeaderScrollContext = createContext(false);

export function useHeaderScrolled() {
  return useContext(HeaderScrollContext);
}

type SiteHeaderProps = {
  announcement: ReactNode;
  children: ReactNode;
};

export default function SiteHeader({ announcement, children }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <HeaderScrollContext.Provider value={scrolled}>
      <div
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 flex flex-col",
          scrolled && "site-header-scrolled site-navbar-scrolled",
        )}
      >
        {announcement}
        {children}
      </div>
    </HeaderScrollContext.Provider>
  );
}
