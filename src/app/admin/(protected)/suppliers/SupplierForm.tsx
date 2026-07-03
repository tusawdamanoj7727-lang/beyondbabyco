"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Textarea, Checkbox } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import {
  createSupplierAction,
  updateSupplierAction,
  type SupplierActionState,
} from "@/lib/admin/supplier-actions";
import type { SupplierEditData } from "@/lib/admin/suppliers";

const initial: SupplierActionState = { ok: false, error: null };

export default function SupplierForm({
  mode,
  initial: data,
}: {
  mode: "create" | "edit";
  initial: SupplierEditData | null;
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateSupplierAction : createSupplierAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && data && <input type="hidden" name="id" value={data.id} />}

      {state.error && (
        <div role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm font-medium text-terra-700">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Supplier saved.
        </div>
      )}

      <div className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6 space-y-5">
        <FormField label="Company name" required error={errors.name}>
          <Input name="name" defaultValue={data?.name} required aria-invalid={!!errors.name} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Contact name" error={errors.contact_name}>
            <Input name="contact_name" defaultValue={data?.contactName ?? ""} />
          </FormField>
          <FormField label="GST" error={errors.gstin}>
            <Input name="gstin" defaultValue={data?.gstin ?? ""} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Email" error={errors.email}>
            <Input name="email" type="email" defaultValue={data?.email ?? ""} aria-invalid={!!errors.email} />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input name="phone" type="tel" defaultValue={data?.phone ?? ""} />
          </FormField>
        </div>

        <FormField label="Address" error={errors.address}>
          <Textarea name="address" rows={3} defaultValue={data?.address ?? ""} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Country" error={errors.country}>
            <Input name="country" defaultValue={data?.country ?? "India"} />
          </FormField>
          <FormField label="Website" error={errors.website}>
            <Input name="website" type="url" defaultValue={data?.website ?? ""} placeholder="https://…" />
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes}>
          <Textarea name="notes" rows={4} defaultValue={data?.notes ?? ""} />
        </FormField>

        <Checkbox name="is_active" label="Active supplier" defaultChecked={data?.isActive ?? true} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}>
          {mode === "edit" ? "Save supplier" : "Create supplier"}
        </Button>
      </div>
    </form>
  );
}
