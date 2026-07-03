"use client";

import { useEffect, useState } from "react";

const SCROLL_OFFSET = 160;

/**
 * Returns the id of the homepage section currently nearest the top of the viewport.
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    function updateActive() {
      let current = sectionIds[0] ?? "";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= SCROLL_OFFSET) {
          current = id;
        }
      }

      setActiveId(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sectionIds]);

  return activeId;
}
