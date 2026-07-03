import Badge from "@/components/ui/Badge";
import {
  PAYMENT_STATUS_LABELS,
  JOURNAL_STATUS_LABELS,
  type ExpensePaymentStatus,
  type JournalStatus,
  type ReconciliationStatus,
  type VendorPaymentStatus,
} from "@/lib/admin/finance-types";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";

const EXPENSE_VARIANT: Record<ExpensePaymentStatus, BadgeVariant> = {
  unpaid: "warning",
  partial: "info",
  paid: "success",
  scheduled: "info",
};

const VENDOR_PAY_VARIANT: Record<VendorPaymentStatus, BadgeVariant> = {
  scheduled: "info",
  paid: "success",
  partial: "warning",
  cancelled: "default",
};

const JOURNAL_VARIANT: Record<JournalStatus, BadgeVariant> = {
  draft: "default",
  pending: "warning",
  approved: "success",
  reversed: "default",
};

const RECON_VARIANT: Record<ReconciliationStatus, BadgeVariant> = {
  pending: "warning",
  partial: "info",
  reconciled: "success",
};

export function ExpensePaymentBadge({ status, size = "sm" }: { status: ExpensePaymentStatus; size?: "sm" | "md" | "lg" }) {
  return <Badge variant={EXPENSE_VARIANT[status]} size={size}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function VendorPaymentBadge({ status, size = "sm" }: { status: VendorPaymentStatus; size?: "sm" | "md" | "lg" }) {
  return <Badge variant={VENDOR_PAY_VARIANT[status]} size={size}>{status}</Badge>;
}

export function JournalStatusBadge({ status, size = "sm" }: { status: JournalStatus; size?: "sm" | "md" | "lg" }) {
  return <Badge variant={JOURNAL_VARIANT[status]} size={size}>{JOURNAL_STATUS_LABELS[status]}</Badge>;
}

export function ReconciliationStatusBadge({ status, size = "sm" }: { status: ReconciliationStatus; size?: "sm" | "md" | "lg" }) {
  return <Badge variant={RECON_VARIANT[status]} size={size}>{status}</Badge>;
}
