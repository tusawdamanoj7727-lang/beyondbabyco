"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Sentry from "@sentry/nextjs";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";

import CheckoutOrderSummary, { useCheckoutTotals } from "@/components/checkout/CheckoutOrderSummary";
import PaymentMethodSelector, { type PaymentMethodId } from "@/components/checkout/PaymentMethodSelector";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MICROCOPY } from "@/lib/brand/copy";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { CheckoutInitialData } from "@/lib/checkout/actions";
import { lookupPincodeAction, placeCheckoutOrderAction, verifyRazorpayCheckoutAction } from "@/lib/checkout/actions";
import { INDIAN_STATES, type AddressFormValues } from "@/lib/checkout/schema";
import type { CustomerAddressRow } from "@/lib/checkout/address-actions";
import { checkDeliveryEstimateAction } from "@/lib/storefront/delivery-actions";
import { useCart } from "@/lib/storefront/cart-context";
import { estimateShippingFee } from "@/lib/storefront/shipping";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics/events";
import { dialogContentCentered, dialogOverlay, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

function notifyCheckoutError(
  toast: ReturnType<typeof useToast>,
  message: string,
) {
  if (/out of stock/i.test(message)) {
    toast.warning("This item is out of stock");
    return;
  }
  toast.error(message || "Something went wrong");
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function emptyAddress(): AddressFormValues {
  return {
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  };
}

function addressFromRow(row: CustomerAddressRow): AddressFormValues {
  return {
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
  };
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment SDK"));
    document.body.appendChild(script);
  });
}

export default function CheckoutClient({ initial }: { initial: CheckoutInitialData }) {
  const router = useRouter();
  const toast = useToast();
  const { items, appliedCoupon, clear } = useCart();
  const [pending, startTransition] = useTransition();
  const placingRef = useRef(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const [customer, setCustomer] = useState({
    full_name: initial.fullName,
    email: initial.email,
    phone: initial.phone,
  });
  const [shipping, setShipping] = useState<AddressFormValues>(() => {
    const defaultAddr = initial.addresses.find((a) => a.type === "shipping" && a.is_default)
      ?? initial.addresses.find((a) => a.type === "shipping");
    return defaultAddr ? addressFromRow(defaultAddr) : { ...emptyAddress(), full_name: initial.fullName, phone: initial.phone };
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValues>(emptyAddress());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(
    initial.razorpayAvailable ? "razorpay" : "cod",
  );
  const [saveAddress, setSaveAddress] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [delivery, setDelivery] = useState<{
    serviceable: boolean;
    cod: boolean;
    prepaid: boolean;
    estimatedDelivery?: string;
  } | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);

  const shippingFee = estimateShippingFee(
    items.reduce((s, i) => s + i.price * i.quantity, 0),
    appliedCoupon?.freeShipping ?? false,
  );
  const totals = useCheckoutTotals(shippingFee, shipping.state || "Rajasthan");

  const checkPin = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;
    setCheckingPin(true);
    try {
      const [deliveryResult, lookup] = await Promise.all([
        checkDeliveryEstimateAction(pincode),
        lookupPincodeAction(pincode),
      ]);
      if (deliveryResult.ok && deliveryResult.serviceable != null) {
        setDelivery({
          serviceable: deliveryResult.serviceable,
          cod: deliveryResult.cod ?? false,
          prepaid: deliveryResult.prepaid ?? false,
          estimatedDelivery: deliveryResult.estimatedDelivery,
        });
      }
      if (lookup.ok && lookup.city) {
        setShipping((prev) => ({
          ...prev,
          city: lookup.city ?? prev.city,
          state: lookup.state ?? prev.state,
        }));
      }
    } finally {
      setCheckingPin(false);
    }
  }, []);

  useEffect(() => {
    if (shipping.pincode.length === 6) void checkPin(shipping.pincode);
  }, [shipping.pincode, checkPin]);

  useEffect(() => {
    if (!initial.razorpayAvailable && paymentMethod === "razorpay") {
      setPaymentMethod("cod");
    }
  }, [initial.razorpayAvailable, paymentMethod]);

  if (items.length === 0) {
    return (
      <CatalogEmptyState
        title={MICROCOPY.cart.checkoutEmptyTitle}
        description={MICROCOPY.cart.checkoutEmptyDescription}
        actionLabel={MICROCOPY.cart.shopCta}
        actionHref="/products"
        mascot="bella-bunny"
      />
    );
  }

  function updateShipping(field: keyof AddressFormValues, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm(): string | null {
    if (!customer.full_name.trim()) return "Enter your name.";
    if (!customer.email.includes("@")) return "Enter a valid email.";
    if (!/^[6-9]\d{9}$/.test(customer.phone)) return "Enter a valid phone number.";
    if (!shipping.line1.trim()) return "Enter shipping address.";
    if (!shipping.city.trim()) return "Enter city.";
    if (!shipping.state.trim()) return "Select state.";
    if (!/^\d{6}$/.test(shipping.pincode)) return "Enter a valid PIN code.";
    if (delivery && !delivery.serviceable) return "Delivery not available to this PIN.";
    if (paymentMethod === "cod" && delivery && !delivery.cod) return "COD not available for this PIN.";
    return null;
  }

  function openReview() {
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }
    setReviewOpen(true);
  }

  function capturePaymentError(error: unknown, extra: { orderId?: string | null; cartTotal: number }) {
    Sentry.captureException(error, {
      tags: { flow: "checkout_payment" },
      extra: {
        orderId: extra.orderId ?? null,
        cartTotal: extra.cartTotal,
        paymentMethod,
      },
    });
  }

  function placeOrder() {
    if (placingRef.current) return;
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }

    placingRef.current = true;
    startTransition(async () => {
      try {
        const result = await placeCheckoutOrderAction({
          idempotencyKey,
          customer,
          shipping,
          billingSameAsShipping: billingSame,
          billing: billingSame ? undefined : billing,
          paymentMethod,
          cartItems: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            name: i.name,
            price: i.price,
            gstRate: i.gstRate,
            variantName: i.variantName,
          })),
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                couponId: appliedCoupon.couponId,
                discountAmount: appliedCoupon.discountAmount,
                freeShipping: appliedCoupon.freeShipping,
              }
            : null,
          shippingTotal: totals.shipping,
          saveShippingAddress: saveAddress,
        });

        if (!result.ok || !result.orderId) {
          capturePaymentError(new Error(result.error ?? "Could not place order"), {
            cartTotal: totals.total,
          });
          notifyCheckoutError(toast, result.error ?? "Could not place order");
          placingRef.current = false;
          return;
        }

        const orderId = result.orderId;

        if (result.paymentMethod === "cod") {
          trackPurchase({
            transactionId: orderId,
            value: result.grandTotal ?? totals.total,
            itemCount: items.length,
          });
          clear();
          router.push(`/checkout/success?orderId=${orderId}`);
          return;
        }

        trackBeginCheckout({
          value: result.grandTotal ?? totals.total,
          itemCount: items.length,
        });

        if (!result.razorpayOrderId || !result.razorpayKeyId) {
          capturePaymentError(new Error("Payment could not be initialized"), {
            orderId,
            cartTotal: totals.total,
          });
          toast.error("Payment could not be initialized.");
          placingRef.current = false;
          return;
        }

        try {
          await loadRazorpayScript();
        } catch (scriptError) {
          capturePaymentError(scriptError, { orderId, cartTotal: totals.total });
          toast.error("Could not load payment SDK. Please try again.");
          placingRef.current = false;
          return;
        }

        const rzp = new window.Razorpay!({
          key: result.razorpayKeyId,
          amount: Math.round((result.grandTotal ?? totals.total) * 100),
          currency: "INR",
          name: "BeyondBabyCo",
          description: `Order ${result.orderNumber}`,
          order_id: result.razorpayOrderId,
          prefill: {
            name: customer.full_name,
            email: customer.email,
            contact: customer.phone,
          },
          theme: { color: "#2d6a4f" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verified = await verifyRazorpayCheckoutAction({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (!verified.ok) {
              capturePaymentError(new Error(verified.error ?? "Payment verification failed"), {
                orderId,
                cartTotal: totals.total,
              });
              router.push(`/checkout/failure?orderId=${orderId}&reason=verify`);
              return;
            }
            trackPurchase({
              transactionId: orderId,
              value: result.grandTotal ?? totals.total,
              itemCount: items.length,
            });
            clear();
            router.push(`/checkout/success?orderId=${orderId}`);
          },
          modal: {
            ondismiss: () => {
              placingRef.current = false;
              router.push(`/checkout/failure?orderId=${orderId}&reason=cancelled`);
            },
          },
        });
        rzp.open();
        setReviewOpen(false);
      } catch (error) {
        capturePaymentError(error, { cartTotal: totals.total });
        toast.error("Something went wrong");
        placingRef.current = false;
      }
    });
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <CheckoutSection title="1. Customer Information" description="We'll send order updates here.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="cust-name">
                <input
                  id="cust-name"
                  value={customer.full_name}
                  onChange={(e) => setCustomer((c) => ({ ...c, full_name: e.target.value }))}
                  className={inputClass}
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone" id="cust-phone">
                <input
                  id="cust-phone"
                  inputMode="numeric"
                  maxLength={10}
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  className={inputClass}
                  autoComplete="tel"
                />
              </Field>
              <Field label="Email" id="cust-email" className="sm:col-span-2">
                <input
                  id="cust-email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  className={inputClass}
                  autoComplete="email"
                />
              </Field>
            </div>
          </CheckoutSection>

          <CheckoutSection title="2. Shipping Address" description="Where should we deliver?">
            {initial.addresses.filter((a) => a.type === "shipping").length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {initial.addresses
                  .filter((a) => a.type === "shipping")
                  .map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setShipping(addressFromRow(addr))}
                      className="rounded-xl border border-green-200 px-3 py-2 text-left text-xs hover:bg-green-50"
                    >
                      <span className="font-semibold text-green-900">{addr.full_name}</span>
                      <span className="block text-green-700/70">{addr.city}, {addr.pincode}</span>
                    </button>
                  ))}
              </div>
            ) : null}
            <AddressFields idPrefix="shipping" values={shipping} onChange={updateShipping} checkingPin={checkingPin} />
            <label className="mt-4 flex items-center gap-2 text-sm text-green-800">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address for next time
            </label>
          </CheckoutSection>

          <CheckoutSection title="3. Billing Address">
            <label className="flex items-center gap-2 text-sm text-green-800">
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
              Same as shipping address
            </label>
            {!billingSame ? (
              <div className="mt-4">
                <AddressFields
                  idPrefix="billing"
                  values={billing}
                  onChange={(field, value) => setBilling((prev) => ({ ...prev, [field]: value }))}
                />
              </div>
            ) : null}
          </CheckoutSection>

          <CheckoutSection title="4. Delivery" description="Based on your PIN code.">
            <div className="flex items-start gap-3 rounded-2xl bg-green-50/80 p-4 text-sm text-green-800">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                {checkingPin ? (
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking delivery…
                  </p>
                ) : delivery ? (
                  delivery.serviceable ? (
                    <>
                      <p className="font-semibold">Delivery available to {shipping.pincode}</p>
                      <p className="mt-1 text-green-700/80">
                        Estimated {delivery.estimatedDelivery ?? "3–5 business days"} · Shipping{" "}
                        {totals.shipping === 0 ? "free" : `₹${totals.shipping}`}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-terra-700">Not serviceable to this PIN</p>
                  )
                ) : (
                  <p>Enter a 6-digit PIN in your shipping address to check delivery.</p>
                )}
              </div>
            </div>
          </CheckoutSection>

          <CheckoutSection title="5. Payment Method">
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              razorpayAvailable={initial.razorpayAvailable}
              codAvailable={delivery?.cod ?? true}
              disabled={pending}
            />
          </CheckoutSection>

          <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white/80 px-4 py-3 text-sm text-green-700">
            <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            Secure checkout · Your payment info is never stored on our servers
          </div>

          <Button variant="primary" fullWidth type="button" disabled={pending} onClick={openReview}>
            Review & Place Order
          </Button>
        </div>

        <CheckoutOrderSummary
          shippingTotal={shippingFee}
          buyerState={shipping.state || "Rajasthan"}
          serviceable={delivery?.serviceable ?? null}
          deliveryEstimate={delivery?.estimatedDelivery}
          codAvailable={delivery?.cod}
        />
      </div>

      <Dialog.Root open={reviewOpen} onOpenChange={setReviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn("fixed inset-0 z-[100]", dialogOverlay)} />
          <Dialog.Content className={cn(dialogContentCentered)}>
            <Dialog.Title className="font-heading text-xl font-bold text-green-900">Review your order</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-green-700/80">
              Confirm details before placing your order.
            </Dialog.Description>

            <div className="mt-5 space-y-4 text-sm">
              <ReviewBlock title="Deliver to">
                <p>{shipping.full_name}</p>
                <p>{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}</p>
                <p>{shipping.city}, {shipping.state} — {shipping.pincode}</p>
                <p>{customer.phone}</p>
              </ReviewBlock>
              <ReviewBlock title="Items">
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={`${i.productId}:${i.variantId}`} className="flex justify-between gap-2">
                      <span>{i.name} × {i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </ReviewBlock>
              <ReviewBlock title="Payment">
                <p>{paymentMethod === "cod" ? "Cash on Delivery" : "Pay Online (Razorpay)"}</p>
              </ReviewBlock>
              <ReviewBlock title="Total">
                <p className="font-heading text-lg font-bold text-green-900">₹{totals.total.toFixed(2)}</p>
              </ReviewBlock>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" fullWidth type="button" disabled={pending} onClick={placeOrder}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
              </Button>
              <Dialog.Close asChild>
                <Button variant="secondary" fullWidth type="button">
                  Edit
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function CheckoutSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-green-100/80 bg-white/90 p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-green-700/70">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-green-800">
        {label}
      </label>
      {children}
    </div>
  );
}

function AddressFields({
  idPrefix,
  values,
  onChange,
  checkingPin,
}: {
  idPrefix: string;
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  checkingPin?: boolean;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const auto = idPrefix === "billing" ? "billing" : "shipping";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" id={id("name")}>
        <input
          id={id("name")}
          value={values.full_name}
          onChange={(e) => onChange("full_name", e.target.value)}
          className={inputClass}
          autoComplete={`${auto} name`}
        />
      </Field>
      <Field label="Phone" id={id("phone")}>
        <input
          id={id("phone")}
          inputMode="numeric"
          maxLength={10}
          value={values.phone}
          onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={inputClass}
          autoComplete="tel"
        />
      </Field>
      <Field label="Address line 1" id={id("line1")} className="sm:col-span-2">
        <input
          id={id("line1")}
          value={values.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          className={inputClass}
          autoComplete={`${auto} address-line1`}
        />
      </Field>
      <Field label="Address line 2" id={id("line2")} className="sm:col-span-2">
        <input
          id={id("line2")}
          value={values.line2 ?? ""}
          onChange={(e) => onChange("line2", e.target.value)}
          className={inputClass}
          autoComplete={`${auto} address-line2`}
        />
      </Field>
      <Field label="PIN code" id={id("pin")}>
        <input
          id={id("pin")}
          inputMode="numeric"
          maxLength={6}
          value={values.pincode}
          onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputClass}
          autoComplete="postal-code"
        />
        {checkingPin ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking PIN…
          </p>
        ) : null}
      </Field>
      <Field label="City" id={id("city")}>
        <input
          id={id("city")}
          value={values.city}
          onChange={(e) => onChange("city", e.target.value)}
          className={inputClass}
          autoComplete={`${auto} address-level2`}
        />
      </Field>
      <Field label="State" id={id("state")} className="sm:col-span-2">
        <select
          id={id("state")}
          value={values.state}
          onChange={(e) => onChange("state", e.target.value)}
          className={inputClass}
          autoComplete={`${auto} address-level1`}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-600">{title}</p>
      <div className="mt-2 text-green-900">{children}</div>
    </div>
  );
}

const inputClass = cn(formControl, "text-sm");
