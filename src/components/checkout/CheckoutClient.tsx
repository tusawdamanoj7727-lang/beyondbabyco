"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Sentry from "@sentry/nextjs";
import { Loader2, MapPin, ShieldCheck, Tag } from "lucide-react";

import CheckoutOrderSummary, { useCheckoutTotals } from "@/components/checkout/CheckoutOrderSummary";
import PaymentMethodSelector, { type PaymentMethodId } from "@/components/checkout/PaymentMethodSelector";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MICROCOPY } from "@/lib/brand/copy";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { CheckoutInitialData } from "@/lib/checkout/actions";
import { lookupPincodeAction, placeCheckoutOrderAction } from "@/lib/checkout/actions";
import { notifyPaymentFailedAction, abandonCheckoutPaymentAction } from "@/lib/checkout/payment-email-actions";
import { INDIAN_STATES, type AddressFormValues } from "@/lib/checkout/schema";
import type { CustomerAddressRow } from "@/lib/checkout/address-actions";
import { formatInr } from "@/lib/catalog/format";
import { checkDeliveryEstimateAction } from "@/lib/storefront/delivery-actions";
import { applyCouponViaApi } from "@/lib/storefront/cart-coupons";
import { useCart } from "@/lib/storefront/cart-context";
import { estimateShippingFee } from "@/lib/storefront/shipping";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics/events";
import { dialogContentCentered, dialogOverlay, focusRing, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;

function notifyCheckoutError(toast: ReturnType<typeof useToast>, message: string) {
  if (/payment gateway not configured|razorpay.*not configured|online payments are not configured/i.test(message)) {
    toast.error(message);
    return;
  }
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

async function verifyRazorpayPayment(input: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: boolean; error?: string; awb?: string | null }> {
  const res = await fetch("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json()) as {
    ok: boolean;
    error?: string;
    data?: { awb?: string | null };
  };
  return { ok: body.ok, error: body.error, awb: body.data?.awb };
}

function focusField(fieldId: string) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in el) (el as HTMLElement).focus({ preventScroll: true });
}

function inputClass() {
  return formControl;
}

export default function CheckoutClient({ initial }: { initial: CheckoutInitialData }) {
  const router = useRouter();
  const toast = useToast();
  const { items, appliedCoupon, clear, hydrated, setAppliedCoupon, subtotal } = useCart();
  const [pending, startTransition] = useTransition();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<"idle" | "placing" | "opening_razorpay">("idle");
  const placingRef = useRef(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const [customer, setCustomer] = useState({
    full_name: initial.fullName,
    email: initial.email,
    phone: initial.phone,
  });
  const [shipping, setShipping] = useState<AddressFormValues>(() => {
    const defaultAddr =
      initial.addresses.find((a) => a.type === "shipping" && a.is_default) ??
      initial.addresses.find((a) => a.type === "shipping");
    return defaultAddr
      ? addressFromRow(defaultAddr)
      : { ...emptyAddress(), full_name: initial.fullName, phone: initial.phone };
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValues>(emptyAddress());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(
    initial.razorpayAvailable ? "razorpay" : "cod",
  );
  const [saveAddress, setSaveAddress] = useState(!initial.isGuest);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [delivery, setDelivery] = useState<{
    serviceable: boolean;
    cod: boolean;
    prepaid: boolean;
    estimatedDelivery?: string;
  } | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; type: "" | "success" | "error" }>({
    text: "",
    type: "",
  });
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const couponId = useId();

  const shippingFee = estimateShippingFee(
    items.reduce((s, i) => s + i.price * i.quantity, 0),
    appliedCoupon?.freeShipping ?? false,
  );
  const totals = useCheckoutTotals(shippingFee, shipping.state || "");

  const checkPin = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;
    setCheckingPin(true);
    setDeliveryError(null);
    try {
      const [deliveryResult, lookup] = await Promise.all([
        checkDeliveryEstimateAction(pincode),
        lookupPincodeAction(pincode),
      ]);
      if (!deliveryResult.ok) {
        setDelivery(null);
        setDeliveryError(deliveryResult.error ?? "Could not check delivery.");
        return;
      }
      if (deliveryResult.serviceable != null) {
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
        setFieldErrors((prev) => {
          if (!prev["shipping.city"] && !prev["shipping.state"] && !prev["shipping.pincode"]) {
            return prev;
          }
          const next = { ...prev };
          delete next["shipping.city"];
          delete next["shipping.state"];
          delete next["shipping.pincode"];
          return next;
        });
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

  useEffect(() => {
    setShipping((prev) => ({
      ...prev,
      full_name: prev.full_name.trim() ? prev.full_name : customer.full_name,
      phone: prev.phone.trim() ? prev.phone : customer.phone,
    }));
  }, [customer.full_name, customer.phone]);

  if (!hydrated) {
    return (
      <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading checkout">
        <div className="h-10 w-48 rounded-xl bg-brand-forest/10" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-36 rounded-2xl bg-brand-forest/5" />
            <div className="h-48 rounded-2xl bg-brand-forest/5" />
            <div className="h-28 rounded-2xl bg-brand-forest/5" />
          </div>
          <div className="h-80 rounded-3xl bg-brand-forest/5" />
        </div>
      </div>
    );
  }

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
    setFieldErrors((prev) => {
      const key = `shipping.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateCustomer<K extends keyof typeof customer>(field: K, value: (typeof customer)[K]) {
    setCustomer((c) => ({ ...c, [field]: value }));
    setFieldErrors((prev) => {
      const key = `customer.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateForm(): { message: string | null; errors: FieldErrors; firstFieldId: string | null } {
    const errors: FieldErrors = {};
    let firstFieldId: string | null = null;

    const setErr = (key: string, fieldId: string, message: string) => {
      if (!errors[key]) {
        errors[key] = message;
        if (!firstFieldId) firstFieldId = fieldId;
      }
    };

    if (customer.full_name.trim().length < 2) {
      setErr("customer.full_name", "cust-name", "Enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      setErr("customer.email", "cust-email", "Enter a valid email address.");
    }
    if (!/^[6-9]\d{9}$/.test(customer.phone)) {
      setErr("customer.phone", "cust-phone", "Enter a valid 10-digit mobile number.");
    }

    if (shipping.full_name.trim().length < 2) {
      setErr("shipping.full_name", "shipping-name", "Enter the recipient’s name.");
    }
    if (!/^[6-9]\d{9}$/.test(shipping.phone)) {
      setErr("shipping.phone", "shipping-phone", "Enter a valid shipping phone number.");
    }
    if (shipping.line1.trim().length < 3) {
      setErr("shipping.line1", "shipping-line1", "Enter your shipping address.");
    }
    if (shipping.city.trim().length < 2) {
      setErr("shipping.city", "shipping-city", "Enter city.");
    }
    if (!shipping.state.trim()) {
      setErr("shipping.state", "shipping-state", "Select state.");
    }
    if (!/^\d{6}$/.test(shipping.pincode)) {
      setErr("shipping.pincode", "shipping-pin", "Enter a valid 6-digit PIN code.");
    }

    if (!billingSame) {
      if (billing.full_name.trim().length < 2) {
        setErr("billing.full_name", "billing-name", "Enter billing name.");
      }
      if (!/^[6-9]\d{9}$/.test(billing.phone)) {
        setErr("billing.phone", "billing-phone", "Enter a valid billing phone.");
      }
      if (billing.line1.trim().length < 3) {
        setErr("billing.line1", "billing-line1", "Enter billing address.");
      }
      if (billing.city.trim().length < 2) {
        setErr("billing.city", "billing-city", "Enter billing city.");
      }
      if (!billing.state.trim()) {
        setErr("billing.state", "billing-state", "Select billing state.");
      }
      if (!/^\d{6}$/.test(billing.pincode)) {
        setErr("billing.pincode", "billing-pin", "Enter a valid billing PIN.");
      }
    }

    if (checkingPin) {
      return { message: "Please wait while we check delivery for your PIN.", errors, firstFieldId };
    }
    if (delivery && !delivery.serviceable) {
      setErr("shipping.pincode", "shipping-pin", "Delivery is not available to this PIN.");
    }
    if (paymentMethod === "cod" && delivery && !delivery.cod) {
      return {
        message: "Cash on Delivery is not available for this PIN. Choose Pay Online.",
        errors,
        firstFieldId: firstFieldId ?? "shipping-pin",
      };
    }
    if (paymentMethod === "razorpay" && !initial.razorpayAvailable) {
      return {
        message:
          "Payment gateway not configured. Online payments are unavailable — choose Cash on Delivery or contact support.",
        errors,
        firstFieldId,
      };
    }

    const firstMessage = firstFieldId ? Object.values(errors)[0] ?? null : null;
    return {
      message: Object.keys(errors).length ? firstMessage : null,
      errors,
      firstFieldId,
    };
  }

  function openReview() {
    const result = validateForm();
    setFieldErrors(result.errors);
    if (result.message || Object.keys(result.errors).length > 0) {
      if (result.firstFieldId) focusField(result.firstFieldId);
      // Field errors render inline; toast only for blocking non-field issues (PIN check, COD, gateway).
      if (result.message && Object.keys(result.errors).length === 0) {
        toast.warning(result.message);
      }
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

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMsg({ text: "Enter a coupon code.", type: "error" });
      return;
    }
    setApplyingCoupon(true);
    setCouponMsg({ text: "", type: "" });
    try {
      const data = await applyCouponViaApi(code, subtotal);
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          couponId: data.couponId,
          discountAmount: data.savings,
          freeShipping: false,
        });
        setCouponMsg({ text: data.message, type: "success" });
        setCouponInput("");
      } else {
        setCouponMsg({ text: data.error ?? "Invalid coupon code", type: "error" });
      }
    } catch {
      setCouponMsg({ text: "Could not apply coupon. Try again.", type: "error" });
    } finally {
      setApplyingCoupon(false);
    }
  }

  function placeOrder() {
    if (placingRef.current || isPlacingOrder) return;
    const result = validateForm();
    setFieldErrors(result.errors);
    if (result.message || Object.keys(result.errors).length > 0) {
      setReviewOpen(false);
      if (result.firstFieldId) focusField(result.firstFieldId);
      return;
    }

    placingRef.current = true;
    setIsPlacingOrder(true);
    setPaymentPhase("placing");
    startTransition(async () => {
      let openedRazorpay = false;
      try {
        const placeResult = await placeCheckoutOrderAction({
          idempotencyKey,
          customer,
          shipping: {
            ...shipping,
            full_name: shipping.full_name.trim() || customer.full_name,
            phone: shipping.phone || customer.phone,
          },
          billingSameAsShipping: billingSame,
          billing: billingSame ? undefined : billing,
          paymentMethod,
          cartItems: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon?.code ?? null,
          saveShippingAddress: initial.isGuest ? false : saveAddress,
        });

        if (!placeResult.ok || !placeResult.orderId) {
          capturePaymentError(new Error(placeResult.error ?? "Could not place order"), {
            cartTotal: totals.total,
          });
          notifyCheckoutError(toast, placeResult.error ?? "Could not place order");
          return;
        }

        const orderId = placeResult.orderId;

        if (placeResult.paymentMethod === "cod") {
          trackPurchase({
            transactionId: orderId,
            value: placeResult.grandTotal ?? totals.total,
            itemCount: items.length,
          });
          clear();
          router.push(`/checkout/success?orderId=${orderId}`);
          return;
        }

        trackBeginCheckout({
          value: placeResult.grandTotal ?? totals.total,
          itemCount: items.length,
        });

        if (!placeResult.razorpayOrderId || !placeResult.razorpayKeyId) {
          capturePaymentError(new Error("Payment could not be initialized"), {
            orderId,
            cartTotal: totals.total,
          });
          toast.error("Payment could not be initialized.");
          return;
        }

        setPaymentPhase("opening_razorpay");
        try {
          await loadRazorpayScript();
        } catch (scriptError) {
          capturePaymentError(scriptError, { orderId, cartTotal: totals.total });
          toast.error("Could not load payment. Please try again.");
          return;
        }

        const rzp = new window.Razorpay!({
          key: placeResult.razorpayKeyId,
          amount: Math.round((placeResult.grandTotal ?? totals.total) * 100),
          currency: "INR",
          name: "BeyondBabyCo",
          description: `Order ${placeResult.orderNumber}`,
          order_id: placeResult.razorpayOrderId,
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
            const verified = await verifyRazorpayPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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
              value: placeResult.grandTotal ?? totals.total,
              itemCount: items.length,
            });
            clear();
            router.push(`/checkout/success?orderId=${orderId}`);
          },
          modal: {
            ondismiss: () => {
              void abandonCheckoutPaymentAction(orderId);
              placingRef.current = false;
              setIsPlacingOrder(false);
              setPaymentPhase("idle");
              setReviewOpen(false);
              toast.warning(
                "Payment cancelled. Your cart is still ready — try again when you’re ready.",
              );
            },
          },
        });
        rzp.on("payment.failed", (response: unknown) => {
          capturePaymentError(response, { orderId, cartTotal: totals.total });
          void notifyPaymentFailedAction(orderId);
          toast.error("Payment failed. Please try again.");
          placingRef.current = false;
          setIsPlacingOrder(false);
          setPaymentPhase("idle");
        });
        rzp.open();
        setReviewOpen(false);
        openedRazorpay = true;
      } catch (error) {
        capturePaymentError(error, { cartTotal: totals.total });
        toast.error("Something went wrong");
      } finally {
        if (!openedRazorpay) {
          placingRef.current = false;
          setIsPlacingOrder(false);
          setPaymentPhase("idle");
        }
      }
    });
  }

  const busy = pending || isPlacingOrder || checkingPin;
  const selectedAddressId = shipping.id;

  return (
    <>
      <form
        className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8 xl:grid-cols-[1fr_420px]"
        autoComplete="on"
        onSubmit={(e) => {
          e.preventDefault();
          openReview();
        }}
      >
        <div className="space-y-5 sm:space-y-6">
          <CheckoutSection
            title="1. Customer Information"
            description={
              initial.isGuest
                ? "Checkout as a guest — enter your email for order updates. No account required."
                : "We'll send order updates here."
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Field label="Full name" id="cust-name" error={fieldErrors["customer.full_name"]}>
                <input
                  id="cust-name"
                  name="name"
                  value={customer.full_name}
                  onChange={(e) => updateCustomer("full_name", e.target.value)}
                  className={inputClass()}
                  autoComplete="name"
                  enterKeyHint="next"
                  aria-invalid={!!fieldErrors["customer.full_name"]}
                  aria-describedby={fieldErrors["customer.full_name"] ? "cust-name-error" : undefined}
                />
              </Field>
              <Field label="Phone" id="cust-phone" error={fieldErrors["customer.phone"]}>
                <input
                  id="cust-phone"
                  name="tel"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={customer.phone}
                  onChange={(e) => updateCustomer("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inputClass()}
                  autoComplete="tel"
                  enterKeyHint="next"
                  aria-invalid={!!fieldErrors["customer.phone"]}
                  aria-describedby={fieldErrors["customer.phone"] ? "cust-phone-error" : undefined}
                />
              </Field>
              <Field
                label="Email"
                id="cust-email"
                className="sm:col-span-2"
                error={fieldErrors["customer.email"]}
              >
                <input
                  id="cust-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  value={customer.email}
                  onChange={(e) => updateCustomer("email", e.target.value)}
                  className={inputClass()}
                  autoComplete="email"
                  enterKeyHint="next"
                  aria-invalid={!!fieldErrors["customer.email"]}
                  aria-describedby={fieldErrors["customer.email"] ? "cust-email-error" : undefined}
                />
              </Field>
            </div>
          </CheckoutSection>

          <CheckoutSection title="2. Shipping Address" description="Where should we deliver?">
            {initial.addresses.filter((a) => a.type === "shipping").length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {initial.addresses
                  .filter((a) => a.type === "shipping")
                  .map((addr) => {
                    const selected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setShipping(addressFromRow(addr));
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            for (const key of Object.keys(next)) {
                              if (key.startsWith("shipping.")) delete next[key];
                            }
                            return next;
                          });
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                          focusRing,
                          selected
                            ? "border-terra-400 bg-terra-50 ring-1 ring-terra-300"
                            : "border-green-200 hover:bg-green-50",
                        )}
                        aria-pressed={selected}
                      >
                        <span className="font-semibold text-green-900">{addr.full_name}</span>
                        <span className="block text-green-700/70">
                          {addr.city}, {addr.pincode}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ) : null}
            <AddressFields
              idPrefix="shipping"
              values={shipping}
              onChange={updateShipping}
              checkingPin={checkingPin}
              errors={fieldErrors}
            />
            {!initial.isGuest ? (
              <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-green-800">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-5 w-5 shrink-0"
                />
                Save this address for next time
              </label>
            ) : (
              <p className="mt-3 text-xs text-green-700/70">
                Want saved addresses next time? You can create an account after placing this order.
              </p>
            )}
          </CheckoutSection>

          <CheckoutSection title="3. Billing Address">
            <label className="flex min-h-11 items-center gap-3 text-sm text-green-800">
              <input
                type="checkbox"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
                className="h-5 w-5 shrink-0"
              />
              Same as shipping address
            </label>
            {!billingSame ? (
              <div className="mt-3">
                <AddressFields
                  idPrefix="billing"
                  values={billing}
                  onChange={(field, value) => {
                    setBilling((prev) => ({ ...prev, [field]: value }));
                    setFieldErrors((prev) => {
                      const key = `billing.${field}`;
                      if (!prev[key]) return prev;
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                  }}
                  errors={fieldErrors}
                />
              </div>
            ) : null}
          </CheckoutSection>

          <CheckoutSection title="4. Delivery" description="Based on your PIN code.">
            <div className="flex items-start gap-3 rounded-2xl bg-green-50/80 p-3.5 text-sm text-green-800 sm:p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                {checkingPin ? (
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking delivery…
                  </p>
                ) : deliveryError ? (
                  <p className="font-semibold text-terra-700">{deliveryError}</p>
                ) : delivery ? (
                  delivery.serviceable ? (
                    <>
                      <p className="font-semibold">Delivery available to {shipping.pincode}</p>
                      <p className="mt-1 text-green-700/80">
                        Estimated {delivery.estimatedDelivery ?? "3–5 business days"} · Shipping{" "}
                        {totals.shipping === 0 ? "free" : formatInr(totals.shipping)}
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
              disabled={busy}
            />
          </CheckoutSection>

          <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white/80 px-4 py-3 text-sm text-green-700">
            <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            Secure checkout · Your payment info is never stored on our servers
          </div>

          <div className="hidden lg:block">
            <Button variant="primary" fullWidth type="submit" disabled={busy} aria-busy={busy}>
              {paymentPhase === "opening_razorpay" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening Razorpay…
                </span>
              ) : checkingPin ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking delivery…
                </span>
              ) : (
                "Review & Place Order"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <CheckoutCouponBlock
            couponId={couponId}
            appliedCode={appliedCoupon?.code ?? null}
            appliedSavings={appliedCoupon?.discountAmount ?? 0}
            couponInput={couponInput}
            couponMsg={couponMsg}
            applying={applyingCoupon}
            disabled={busy}
            onInputChange={setCouponInput}
            onApply={() => void handleApplyCoupon()}
            onRemove={() => {
              setAppliedCoupon(null);
              setCouponMsg({ text: "", type: "" });
            }}
          />
          <CheckoutOrderSummary
            shippingTotal={shippingFee}
            buyerState={shipping.state.trim() || undefined}
            serviceable={delivery?.serviceable ?? null}
            deliveryEstimate={delivery?.estimatedDelivery}
            codAvailable={delivery?.cod}
          />
        </div>
      </form>

      <div className="checkout-mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:hidden pt-3 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-green-700/80">Total payable</p>
            <p className="font-heading text-lg font-bold text-green-900">{formatInr(totals.total)}</p>
          </div>
          <Button
            variant="primary"
            type="button"
            className="min-w-[10.5rem] shrink-0"
            disabled={busy}
            onClick={openReview}
          >
            {paymentPhase === "opening_razorpay" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Review order"
            )}
          </Button>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden="true" />

      <Dialog.Root
        open={reviewOpen}
        onOpenChange={(open) => {
          if (isPlacingOrder) return;
          setReviewOpen(open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={cn("fixed inset-0 z-[100]", dialogOverlay)} />
          <Dialog.Content className={cn(dialogContentCentered)} aria-describedby="review-desc">
            <Dialog.Title className="font-heading text-xl font-bold text-green-900">
              Review your order
            </Dialog.Title>
            <Dialog.Description id="review-desc" className="mt-1 text-sm text-green-700/80">
              Confirm details before placing your order.
            </Dialog.Description>

            <div className="mt-5 space-y-3 text-sm">
              <ReviewBlock title="Contact">
                <p>{customer.full_name}</p>
                <p>{customer.email}</p>
                <p>{customer.phone}</p>
              </ReviewBlock>
              <ReviewBlock title="Deliver to">
                <p>{shipping.full_name || customer.full_name}</p>
                <p>
                  {shipping.line1}
                  {shipping.line2 ? `, ${shipping.line2}` : ""}
                </p>
                <p>
                  {shipping.city}, {shipping.state} — {shipping.pincode}
                </p>
                <p>{shipping.phone || customer.phone}</p>
              </ReviewBlock>
              <ReviewBlock title="Items">
                <ul className="space-y-1.5">
                  {items.map((i) => (
                    <li key={`${i.productId}:${i.variantId}`} className="flex justify-between gap-2">
                      <span className="min-w-0">
                        {i.name}
                        {i.variantName ? ` · ${i.variantName}` : ""} × {i.quantity}
                      </span>
                      <span className="shrink-0 font-medium">{formatInr(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </ReviewBlock>
              <ReviewBlock title="Payment & total">
                <div className="flex justify-between gap-2">
                  <span>{paymentMethod === "cod" ? "Cash on Delivery" : "Pay Online (Razorpay)"}</span>
                  <span className="font-heading text-lg font-bold text-green-900">
                    {formatInr(totals.total)}
                  </span>
                </div>
                {appliedCoupon ? (
                  <p className="mt-1 text-xs text-terra-600">
                    Coupon {appliedCoupon.code} (−{formatInr(appliedCoupon.discountAmount)})
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-green-700/70">
                  Shipping {totals.shipping === 0 ? "free" : formatInr(totals.shipping)} · Prices include GST
                </p>
              </ReviewBlock>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                fullWidth
                type="button"
                disabled={isPlacingOrder}
                onClick={placeOrder}
                aria-busy={isPlacingOrder}
              >
                {paymentPhase === "opening_razorpay" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening Razorpay…
                  </span>
                ) : isPlacingOrder ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Placing order…
                  </span>
                ) : paymentMethod === "cod" ? (
                  "Place COD order"
                ) : (
                  "Pay securely"
                )}
              </Button>
              {!isPlacingOrder ? (
                <Dialog.Close asChild>
                  <Button variant="secondary" fullWidth type="button">
                    Edit
                  </Button>
                </Dialog.Close>
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function CheckoutCouponBlock({
  couponId,
  appliedCode,
  appliedSavings,
  couponInput,
  couponMsg,
  applying,
  disabled,
  onInputChange,
  onApply,
  onRemove,
}: {
  couponId: string;
  appliedCode: string | null;
  appliedSavings: number;
  couponInput: string;
  couponMsg: { text: string; type: "" | "success" | "error" };
  applying: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-3xl border border-green-100/80 bg-white/95 p-4 shadow-sm sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-900">
        <Tag className="h-4 w-4 text-terra-600" aria-hidden="true" />
        Coupon
      </p>
      {appliedCode ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <span className="text-sm font-semibold text-green-800">
            {appliedCode}
            {appliedSavings > 0 ? ` — save ${formatInr(appliedSavings)}` : ""}
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={cn("text-xs font-medium text-green-700 hover:text-terra-600", focusRing)}
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <label htmlFor={couponId} className="sr-only">
              Coupon code
            </label>
            <input
              id={couponId}
              value={couponInput}
              onChange={(e) => onInputChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply();
                }
              }}
              placeholder="Enter code"
              disabled={applying || disabled}
              autoComplete="off"
              enterKeyHint="go"
              className={formControl}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={applying || disabled || !couponInput.trim()}
              onClick={onApply}
              className="shrink-0 px-4"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Apply"}
            </Button>
          </div>
          {couponMsg.text ? (
            <p
              className={cn(
                "mt-1.5 text-xs",
                couponMsg.type === "success" ? "text-green-600" : "text-terra-700",
              )}
              role="status"
            >
              {couponMsg.text}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-green-700/70">
              Have a code? Apply it here before placing your order.
            </p>
          )}
        </div>
      )}
    </div>
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
    <section className="rounded-3xl border border-green-100/80 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-green-700/70">{description}</p> : null}
      <div className="mt-3 sm:mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  id,
  children,
  className,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-green-800">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-terra-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AddressFields({
  idPrefix,
  values,
  onChange,
  checkingPin,
  errors = {},
}: {
  idPrefix: string;
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  checkingPin?: boolean;
  errors?: FieldErrors;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const auto = idPrefix === "billing" ? "billing" : "shipping";
  const err = (field: string) => errors[`${idPrefix}.${field}`];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <Field label="Full name" id={id("name")} error={err("full_name")}>
        <input
          id={id("name")}
          name={`${auto} name`}
          value={values.full_name}
          onChange={(e) => onChange("full_name", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} name`}
          enterKeyHint="next"
          aria-invalid={!!err("full_name")}
          aria-describedby={err("full_name") ? `${id("name")}-error` : undefined}
        />
      </Field>
      <Field label="Phone" id={id("phone")} error={err("phone")}>
        <input
          id={id("phone")}
          name={`${auto} tel`}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={values.phone}
          onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={inputClass()}
          autoComplete={`${auto} tel`}
          enterKeyHint="next"
          aria-invalid={!!err("phone")}
          aria-describedby={err("phone") ? `${id("phone")}-error` : undefined}
        />
      </Field>
      <Field label="Address line 1" id={id("line1")} className="sm:col-span-2" error={err("line1")}>
        <input
          id={id("line1")}
          value={values.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-line1`}
          enterKeyHint="next"
          aria-invalid={!!err("line1")}
          aria-describedby={err("line1") ? `${id("line1")}-error` : undefined}
        />
      </Field>
      <Field label="Address line 2 (optional)" id={id("line2")} className="sm:col-span-2">
        <input
          id={id("line2")}
          value={values.line2 ?? ""}
          onChange={(e) => onChange("line2", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-line2`}
          enterKeyHint="next"
        />
      </Field>
      <Field label="PIN code" id={id("pin")} error={err("pincode")}>
        <input
          id={id("pin")}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={values.pincode}
          onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputClass()}
          autoComplete={`${auto} postal-code`}
          enterKeyHint="next"
          aria-invalid={!!err("pincode")}
          aria-describedby={err("pincode") ? `${id("pin")}-error` : undefined}
        />
        {checkingPin ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Checking PIN…
          </p>
        ) : null}
      </Field>
      <Field label="City" id={id("city")} error={err("city")}>
        <input
          id={id("city")}
          value={values.city}
          onChange={(e) => onChange("city", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-level2`}
          enterKeyHint="next"
          aria-invalid={!!err("city")}
          aria-describedby={err("city") ? `${id("city")}-error` : undefined}
        />
      </Field>
      <Field label="State" id={id("state")} className="sm:col-span-2" error={err("state")}>
        <select
          id={id("state")}
          value={values.state}
          onChange={(e) => onChange("state", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-level1`}
          aria-invalid={!!err("state")}
          aria-describedby={err("state") ? `${id("state")}-error` : undefined}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <input type="hidden" autoComplete={`${auto} country-name`} value="India" readOnly />
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white/80 p-3.5 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-600">{title}</p>
      <div className="mt-2 text-green-900">{children}</div>
    </div>
  );
}
