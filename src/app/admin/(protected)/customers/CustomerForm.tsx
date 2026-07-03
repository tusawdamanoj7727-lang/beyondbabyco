"use client";

import { useActionState } from "react";

import FormField, { Input, Select, Textarea } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import type { CustomerDetail } from "@/lib/admin/customer-types";
import { createCustomerAction, updateCustomerAction, type CustomerActionResult } from "@/lib/admin/customer-actions";

const initial: CustomerActionResult = { ok: false, error: null };

export default function CustomerForm(props: { mode: "create" | "edit"; customer?: CustomerDetail }) {
  const action = props.mode === "create" ? createCustomerAction : updateCustomerAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const c = props.customer;

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-cream-200 bg-white p-6">
      {props.mode === "edit" && c && <input type="hidden" name="id" value={c.id} />}

      {state.error && (
        <p role="alert" className="rounded-2xl bg-terra-50 px-4 py-2 text-sm text-terra-700">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" error={state.fieldErrors?.full_name}>
          <Input name="full_name" defaultValue={c?.fullName} required aria-required="true" />
        </FormField>
        <FormField label="Email" error={state.fieldErrors?.email}>
          <Input name="email" type="email" defaultValue={c?.email ?? ""} />
        </FormField>
        <FormField label="Phone">
          <Input name="phone" type="tel" defaultValue={c?.phone ?? ""} />
        </FormField>
        <FormField label="Avatar URL">
          <Input name="avatar_url" type="url" defaultValue={c?.avatarUrl ?? ""} />
        </FormField>
        <FormField label="Status">
          <Select name="status" defaultValue={c?.status ?? "active"} aria-label="Customer status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
        <FormField label="VIP">
          <label className="flex h-12 items-center gap-2 text-sm text-green-800">
            <input type="checkbox" name="is_vip" defaultChecked={c?.isVip} className="rounded border-green-300" />
            Mark as VIP customer
          </label>
        </FormField>
      </div>

      <FormField label="Tags (comma-separated)">
        <Input name="tags" defaultValue={c?.tags.join(", ") ?? ""} placeholder="wholesale, premium" />
      </FormField>

      <FormField label="Customer notes">
        <Textarea name="notes" rows={3} defaultValue={c?.notes ?? ""} aria-label="Customer notes" />
      </FormField>

      <FormField label="Internal comments">
        <Textarea name="internal_notes" rows={3} defaultValue={c?.internalNotes ?? ""} aria-label="Internal comments" />
      </FormField>

      <Button type="submit" disabled={pending} leftIcon={pending ? <Spinner size={16} /> : undefined}>
        {props.mode === "create" ? "Create customer" : "Save changes"}
      </Button>
    </form>
  );
}
