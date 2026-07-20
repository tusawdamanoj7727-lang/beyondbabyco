"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  buildCategoryNotifyTarget,
  type NotifyMeTarget,
} from "@/lib/notify-me/target";

const NotifyMeModal = dynamic(() => import("@/components/notify/NotifyMeModal"), {
  ssr: false,
});

type NotifyMeContextValue = {
  openNotifyMe: (target: NotifyMeTarget | string) => void;
};

const NotifyMeContext = createContext<NotifyMeContextValue | null>(null);

const emptyTarget: NotifyMeTarget = { productCategory: "" };

export function NotifyMeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<NotifyMeTarget>(emptyTarget);

  const openNotifyMe = useCallback((input: NotifyMeTarget | string) => {
    if (typeof input === "string") {
      setTarget(buildCategoryNotifyTarget(input));
    } else {
      setTarget(input);
    }
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openNotifyMe }), [openNotifyMe]);

  return (
    <NotifyMeContext.Provider value={value}>
      {children}
      {open ? (
        <NotifyMeModal
          open={open}
          productCategory={target.productCategory}
          productId={target.productId}
          productName={target.productName}
          mode={target.mode}
          onClose={() => setOpen(false)}
        />
      ) : null}
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

export type { NotifyMeTarget };
