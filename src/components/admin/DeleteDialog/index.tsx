"use client";

import ConfirmDialog from "../ConfirmDialog";

export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of a single item, e.g. the product name. */
  itemName?: string;
  /** Number of items for bulk deletes (overrides itemName). */
  count?: number;
  loading?: boolean;
  onConfirm: () => void;
}

export default function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  count,
  loading,
  onConfirm,
}: DeleteDialogProps) {
  const target =
    count && count > 1 ? `${count} products` : itemName ? `“${itemName}”` : "this product";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      title={count && count > 1 ? "Delete products?" : "Delete product?"}
      description={
        <>
          You&apos;re about to delete {target}. This moves it to trash (soft delete) and it can be
          restored later from the archived view.
        </>
      }
      confirmLabel={loading ? "Deleting…" : "Delete"}
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
