"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select, Checkbox } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import {
  createWarehouseAction,
  updateWarehouseAction,
  type WarehouseActionState,
} from "@/lib/admin/warehouse-actions";
import type { WarehouseEditData } from "@/lib/admin/warehouses";
import { WAREHOUSE_STATUSES } from "@/lib/admin/inventory-types";

const initial: WarehouseActionState = { ok: false, error: null };

export default function WarehouseForm({
  mode,
  initial: data,
}: {
  mode: "create" | "edit";
  initial: WarehouseEditData | null;
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateWarehouseAction : createWarehouseAction;
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
          Warehouse saved.
        </div>
      )}

      <div className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Name" required error={errors.name}>
            <Input name="name" defaultValue={data?.name} required aria-invalid={!!errors.name} />
          </FormField>
          <FormField label="Code" required error={errors.code} description="Unique warehouse code, e.g. WH-MUM-01">
            <Input name="code" defaultValue={data?.code} required className="uppercase" aria-invalid={!!errors.code} />
          </FormField>
        </div>

        <FormField label="Address" error={errors.address}>
          <Input name="address" defaultValue={data?.address ?? ""} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="City" error={errors.city}>
            <Input name="city" defaultValue={data?.city ?? ""} />
          </FormField>
          <FormField label="State" error={errors.state}>
            <Input name="state" defaultValue={data?.state ?? ""} />
          </FormField>
          <FormField label="Country" error={errors.country}>
            <Input name="country" defaultValue={data?.country ?? "India"} />
          </FormField>
          <FormField label="Postal code" error={errors.pincode}>
            <Input name="pincode" defaultValue={data?.pincode ?? ""} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Contact person" error={errors.contact_person}>
            <Input name="contact_person" defaultValue={data?.contactPerson ?? ""} />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input name="phone" type="tel" defaultValue={data?.phone ?? ""} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <Input name="email" type="email" defaultValue={data?.email ?? ""} aria-invalid={!!errors.email} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Status" error={errors.status}>
            <Select name="status" defaultValue={data?.status ?? "active"}>
              {WAREHOUSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "active" ? "Active" : "Inactive"}
                </option>
              ))}
            </Select>
          </FormField>
          <Checkbox
            name="is_default"
            label="Default warehouse"
            description="Used when no warehouse is explicitly selected."
            defaultChecked={data?.isDefault ?? false}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}>
          {mode === "edit" ? "Save warehouse" : "Create warehouse"}
        </Button>
      </div>
    </form>
  );
}
