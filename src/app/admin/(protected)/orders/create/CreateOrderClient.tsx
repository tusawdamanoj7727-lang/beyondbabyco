"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { createOrder } from "@/lib/admin/order-actions";
import type { CreateOrderInput } from "@/lib/admin/order-schema";

interface LineItem {
  product_variant_id: string;
  product_id: string;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  tax_rate: number;
}

export default function CreateOrderClient(props: {
  warehouses: { id: string; name: string; code: string }[];
  customers: { id: string; name: string }[];
  shippingMethods: { id: string; name: string; base_rate: number }[];
  variants: { id: string; name: string; sku: string | null; price: number; productId: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [status, setStatus] = useState<"draft" | "pending">("draft");
  const [shippingTotal, setShippingTotal] = useState("0");
  const [discountTotal, setDiscountTotal] = useState("0");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [variantPick, setVariantPick] = useState("");
  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  function addLine() {
    const v = props.variants.find((x) => x.id === variantPick);
    if (!v) return;
    setLines((prev) => [
      ...prev,
      {
        product_variant_id: v.id,
        product_id: v.productId,
        name: v.name,
        sku: v.sku ?? "",
        unit_price: v.price,
        quantity: 1,
        tax_rate: 0,
      },
    ]);
    setVariantPick("");
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    setError(null);
    const payload: CreateOrderInput = {
      customer_id: customerId || null,
      warehouse_id: warehouseId || null,
      shipping_method_id: shippingMethodId || null,
      status,
      notes: null,
      internal_notes: null,
      shipping_total: Number(shippingTotal) || 0,
      discount_total: Number(discountTotal) || 0,
      items: lines.map((l) => ({
        product_variant_id: l.product_variant_id,
        product_id: l.product_id,
        name: l.name,
        sku: l.sku || null,
        unit_price: l.unit_price,
        quantity: l.quantity,
        tax_rate: l.tax_rate,
      })),
      shipping_address: {
        full_name: address.full_name,
        phone: address.phone || null,
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
      },
    };

    startTransition(async () => {
      const res = await createOrder(payload);
      if (!res.ok) {
        setError(res.error ?? "Failed to create order.");
        return;
      }
      if (res.id) router.push(`/admin/orders/${res.id}`);
    });
  }

  return (
    <div className="space-y-6 rounded-3xl border border-cream-200 bg-white p-6">
      {error && (
        <p role="alert" className="rounded-2xl bg-terra-50 px-4 py-2 text-sm text-terra-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Customer">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} aria-label="Customer">
            <option value="">Guest</option>
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Warehouse">
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} aria-label="Warehouse">
            <option value="">Select warehouse</option>
            {props.warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Shipping method">
          <Select value={shippingMethodId} onChange={(e) => setShippingMethodId(e.target.value)} aria-label="Shipping method">
            <option value="">Select method</option>
            {props.shippingMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "pending")} aria-label="Order status">
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
          </Select>
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-bold text-green-900">Line items</legend>
        <div className="flex flex-wrap gap-2">
          <Select value={variantPick} onChange={(e) => setVariantPick(e.target.value)} className="flex-1 min-w-[200px]" aria-label="Add variant">
            <option value="">Select variant…</option>
            {props.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.name} — ₹{v.price}</option>
            ))}
          </Select>
          <Button type="button" variant="ghost" onClick={addLine} disabled={!variantPick}>Add</Button>
        </div>
        {lines.map((line, idx) => (
          <div key={idx} className="flex flex-wrap items-end gap-2 rounded-2xl border border-cream-200 p-3">
            <span className="flex-1 text-sm font-medium text-green-900">{line.name}</span>
            <FormField label="Qty" className="w-20">
              <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} aria-label={`Quantity for ${line.name}`} />
            </FormField>
            <FormField label="Price" className="w-24">
              <Input type="number" min={0} value={line.unit_price} onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) })} aria-label={`Price for ${line.name}`} />
            </FormField>
            <button type="button" onClick={() => removeLine(idx)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50" aria-label={`Remove ${line.name}`}>
              Remove
            </button>
          </div>
        ))}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="col-span-full font-heading text-sm font-bold text-green-900">Shipping address</legend>
        <FormField label="Full name"><Input value={address.full_name} onChange={(e) => setAddress((a) => ({ ...a, full_name: e.target.value }))} required /></FormField>
        <FormField label="Phone"><Input value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} /></FormField>
        <FormField label="Address line 1" className="sm:col-span-2"><Input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} required /></FormField>
        <FormField label="City"><Input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} required /></FormField>
        <FormField label="State"><Input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} required /></FormField>
        <FormField label="Pincode"><Input value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))} required /></FormField>
        <FormField label="Country"><Input value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} /></FormField>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Shipping total"><Input type="number" min={0} value={shippingTotal} onChange={(e) => setShippingTotal(e.target.value)} /></FormField>
        <FormField label="Discount total"><Input type="number" min={0} value={discountTotal} onChange={(e) => setDiscountTotal(e.target.value)} /></FormField>
      </div>

      <Button onClick={submit} disabled={pending || lines.length === 0} leftIcon={pending ? <Spinner size={16} /> : undefined}>
        Create order
      </Button>
    </div>
  );
}
