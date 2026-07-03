"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import NotifyMeDialog from "@/components/homepage/NotifyMeDialog";

type NotifyMeContextValue = {
  openNotifyMe: (productName: string, interest?: string) => void;
};

const NotifyMeContext = createContext<NotifyMeContextValue | null>(null);

export function NotifyMeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [interest, setInterest] = useState<string | undefined>();

  const openNotifyMe = useCallback((product: string, category?: string) => {
    setProductName(product);
    setInterest(category);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openNotifyMe }), [openNotifyMe]);

  return (
    <NotifyMeContext.Provider value={value}>
      {children}
      <NotifyMeDialog
        open={open}
        productName={productName}
        interest={interest}
        onClose={() => setOpen(false)}
      />
    </NotifyMeContext.Provider>
  );
}

export function useNotifyMe(): NotifyMeContextValue {
  const ctx = useContext(NotifyMeContext);
  if (!ctx) {
    return { openNotifyMe: () => {} };
  }
  return ctx;
}
