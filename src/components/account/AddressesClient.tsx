"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import {
  deleteCustomerAddressAction,
  getCustomerAddressesAction,
  lookupPincodeAction,
  upsertCustomerAddressAction,
  type CustomerAddressRow,
} from "@/lib/checkout/address-actions";
import { INDIAN_STATES, type AddressFormValues } from "@/lib/checkout/schema";
import { formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const emptyForm = (): AddressFormValues => ({
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
});

export default function AddressesClient({ initial }: { initial: CustomerAddressRow[] }) {
  const toast = useToast();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<AddressFormValues | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const list = await getCustomerAddressesAction();
    setAddresses(list);
  }

  function startAdd() {
    setEditing(emptyForm());
  }

  function startEdit(row: CustomerAddressRow) {
    setEditing({
      id: row.id,
      full_name: row.full_name ?? "",
      phone: row.phone ?? "",
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      country: row.country,
      pincode: row.pincode,
      is_default: row.is_default,
    });
  }

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const result = await upsertCustomerAddressAction({
        ...editing,
        type: "shipping",
        is_default: editing.is_default ?? addresses.length === 0,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save address");
        return;
      }
      toast.success("Address saved");
      setEditing(null);
      await refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCustomerAddressAction(id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete");
        return;
      }
      toast.info("Address removed");
      await refresh();
    });
  }

  useEffect(() => {
    if (!editing || editing.pincode.length !== 6) return;
    void lookupPincodeAction(editing.pincode).then((res) => {
      if (res.ok && res.city) {
        setEditing((prev) =>
          prev ? { ...prev, city: res.city ?? prev.city, state: res.state ?? prev.state } : prev,
        );
      }
    });
  }, [editing?.pincode, editing]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-green-700">{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</p>
        <Button variant="primary" size="sm" type="button" onClick={startAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 && !editing ? (
        <p className="rounded-2xl border border-dashed border-green-200 bg-white/60 p-8 text-center text-green-700">
          No saved addresses yet. Add one for faster checkout.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className="rounded-2xl border border-green-100 bg-white/90 p-5 shadow-sm"
            >
              {addr.is_default ? (
                <span className="mb-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  Default
                </span>
              ) : null}
              <p className="font-heading font-semibold text-green-900">{addr.full_name}</p>
              <p className="mt-1 text-sm text-green-700">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
                <br />
                {addr.city}, {addr.state} — {addr.pincode}
                <br />
                {addr.phone}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  className="inline-flex items-center gap-1 rounded-xl border border-green-200 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(addr.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-terra-200 px-3 py-1.5 text-sm font-medium text-terra-700 hover:bg-terra-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-card">
          <h2 className="font-heading text-lg font-bold text-green-900">
            {editing.id ? "Edit address" : "New address"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["full_name", "Full name", "text"],
                ["phone", "Phone", "tel"],
                ["line1", "Address line 1", "text"],
                ["line2", "Address line 2", "text"],
                ["pincode", "PIN code", "text"],
                ["city", "City", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className={key === "line1" || key === "line2" ? "sm:col-span-2" : ""}>
                <span className="mb-1 block text-sm font-medium text-green-800">{label}</span>
                <input
                  type={type}
                  value={String(editing[key] ?? "")}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            [key]:
                              key === "phone" || key === "pincode"
                                ? e.target.value.replace(/\D/g, "").slice(0, key === "phone" ? 10 : 6)
                                : e.target.value,
                          }
                        : prev,
                    )
                  }
                  className={cn("w-full", formControl, "text-sm")}
                />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-green-800">State</span>
              <select
                value={editing.state}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, state: e.target.value } : prev))}
                className={cn("w-full", formControl, "text-sm")}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.is_default ?? false}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, is_default: e.target.checked } : prev))
                }
              />
              <span className="text-sm text-green-800">Set as default</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="sm" type="button" disabled={pending} onClick={save}>
              Save address
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
