import { z } from "zod";

import { EXPENSE_CATEGORIES, LEDGER_TYPES, GST_REPORT_TYPES } from "./finance-types";

const optionalText = z.string().trim().max(5000).optional().nullable().transform((v) => (v && v.length ? v : null));
const optionalUuid = z.string().uuid().optional().nullable();

export const expenseInputSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional().nullable(),
  vendor_id: optionalUuid,
  amount: z.number().positive(),
  gst_amount: z.number().min(0).default(0),
  currency: z.string().length(3).default("INR"),
  invoice_number: optionalText,
  invoice_date: optionalText,
  payment_status: z.enum(["unpaid", "partial", "paid", "scheduled"]).default("unpaid"),
  notes: optionalText,
  spent_at: optionalText,
});

export const vendorInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  gst_number: optionalText,
  pan: optionalText,
  bank_details: z.record(z.string(), z.unknown()).default({}),
  contact_person: optionalText,
  email: z.string().email().optional().nullable().or(z.literal("")).transform((v) => v || null),
  phone: optionalText,
  payment_terms: optionalText,
  is_active: z.boolean().default(true),
});

export const journalInputSchema = z.object({
  reference: z.string().trim().min(1).max(100),
  narration: optionalText,
  entry_date: z.string().min(1),
  lines: z.array(z.object({
    ledger_type: z.enum(LEDGER_TYPES),
    account_code: optionalText,
    narration: optionalText,
    debit: z.number().min(0),
    credit: z.number().min(0),
  })).min(2),
});

export const vendorPaymentInputSchema = z.object({
  vendor_id: z.string().uuid(),
  expense_id: optionalUuid,
  amount: z.number().positive(),
  payment_status: z.enum(["scheduled", "paid", "partial"]).default("scheduled"),
  scheduled_date: optionalText,
  reference: optionalText,
  notes: optionalText,
});

export const reconcileInputSchema = z.object({
  bank_account_id: z.string().uuid(),
  statement_date: z.string().min(1),
  opening_balance: z.number(),
  closing_balance: z.number(),
  notes: optionalText,
});

export const gstExportSchema = z.object({
  report_type: z.enum(GST_REPORT_TYPES),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  format: z.enum(["csv", "json"]),
});

export const financeExportSchema = z.object({
  report_type: z.string().min(1),
  format: z.enum(["csv", "excel", "pdf"]),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))).default([]),
  columns: z.array(z.object({ key: z.string(), header: z.string() })).default([]),
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
