"use client";

import Button from "@/components/ui/Button";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { buildCategoryNotifyTarget } from "@/lib/notify-me/target";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function NotifyMeButton({
  productCategory,
  label = "Notify Me",
  className,
}: {
  productCategory: string;
  label?: string;
  className?: string;
}) {
  const { openNotifyMe } = useNotifyMe();

  return (
    <Button
      variant="secondary"
      fullWidth
      type="button"
      className={cn(focusRing, className)}
      onClick={() => openNotifyMe(buildCategoryNotifyTarget(productCategory))}
    >
      {label}
    </Button>
  );
}
