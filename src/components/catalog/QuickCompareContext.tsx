"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import QuickCompareBar from "@/components/catalog/QuickCompareBar";
import QuickCompareModal from "@/components/catalog/QuickCompareModal";
import type { StorefrontProduct } from "@/lib/catalog/types";

const MAX_COMPARE = 2;

type QuickCompareContextValue = {
  enabled: boolean;
  selected: StorefrontProduct[];
  isSelected: (id: string) => boolean;
  toggle: (product: StorefrontProduct) => void;
  clear: () => void;
  openModal: () => void;
};

const QuickCompareContext = createContext<QuickCompareContextValue | null>(null);

export function useQuickCompareOptional() {
  return useContext(QuickCompareContext);
}

export function QuickCompareProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [selected, setSelected] = useState<StorefrontProduct[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const isSelected = useCallback((id: string) => selected.some((p) => p.id === id), [selected]);

  const toggle = useCallback((product: StorefrontProduct) => {
    setSelected((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= MAX_COMPARE) {
        return [prev[1], product];
      }
      return [...prev, product];
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo(
    (): QuickCompareContextValue => ({
      enabled,
      selected,
      isSelected,
      toggle,
      clear,
      openModal: () => setModalOpen(true),
    }),
    [enabled, selected, isSelected, toggle, clear],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <QuickCompareContext.Provider value={value}>
      {children}
      <QuickCompareBar onCompare={() => setModalOpen(true)} />
      <QuickCompareModal open={modalOpen} onOpenChange={setModalOpen} products={selected} />
    </QuickCompareContext.Provider>
  );
}
