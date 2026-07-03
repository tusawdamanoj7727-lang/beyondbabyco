"use client";

import Button from "@/components/ui/Button";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function NotifyMeButton({
  productName,
  category,
  label,
  className,
}: {
  productName: string;
  category: string;
  label: string;
  className?: string;
}) {
  const { openNotifyMe } = useNotifyMe();

  return (
    <Button
      variant="secondary"
      fullWidth
      type="button"
      className={cn(focusRing, className)}
      onClick={() => openNotifyMe(productName, category)}
    >
      {label}
    </Button>
  );
}
