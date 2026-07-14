"use server";

import { revalidatePath } from "next/cache";

import { ensureCustomerRecordsForUser } from "@/lib/auth/customer-bootstrap";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCustomerAddressesAction,
  upsertCustomerAddressAction,
  deleteCustomerAddressAction,
  lookupPincodeAction,
  type CustomerAddressRow,
} from "@/lib/checkout/address-actions";
import { getStorefrontPaymentOptions } from "@/lib/checkout/gateways";
import {
  completeRazorpayOrder,
  getCheckoutOrderSummary,
  placeStorefrontOrder,
} from "@/lib/checkout/place-order";
import type { PlaceOrderInput } from "@/lib/checkout/schema";

export interface CheckoutInitialData {
  fullName: string;
  email: string;
  phone: string;
  addresses: CustomerAddressRow[];
  razorpayAvailable: boolean;
  razorpayKeyId: string | null;
}

export interface CheckoutActionResult {
  ok: boolean;
  error: string | null;
  orderId?: string;
  orderNumber?: string;
  grandTotal?: number;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  paymentMethod?: "razorpay" | "cod";
  awb?: string;
}

async function requireCustomerId(): Promise<{ customerId: string | null; authenticated: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { customerId: null, authenticated: false };

  let customerId = await getCustomerIdForUser(user.id);
  if (!customerId) {
    customerId = await ensureCustomerRecordsForUser(user);
  }

  return { customerId, authenticated: true };
}

export async function getCheckoutInitialDataAction(): Promise<CheckoutInitialData | null> {
  const user = await getCurrentUser();
  const { customerId } = await requireCustomerId();
  if (!user || !customerId) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: customer }, addresses, paymentOptions] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("customers").select("full_name, email, phone").eq("id", customerId).maybeSingle(),
    getCustomerAddressesAction(),
    getStorefrontPaymentOptions(),
  ]);

  return {
    fullName: customer?.full_name ?? profile?.full_name ?? "",
    email: customer?.email ?? user.email ?? "",
    phone: customer?.phone?.replace(/\D/g, "").slice(-10) ?? "",
    addresses,
    razorpayAvailable: paymentOptions.razorpayAvailable,
    razorpayKeyId: paymentOptions.razorpayKeyId,
  };
}

export async function placeCheckoutOrderAction(input: PlaceOrderInput): Promise<CheckoutActionResult> {
  const { customerId, authenticated } = await requireCustomerId();
  if (!authenticated) return { ok: false, error: "Sign in to checkout." };
  if (!customerId) {
    return {
      ok: false,
      error: "Unable to set up your checkout profile. Please try again or contact support.",
    };
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("customers")
    .update({
      full_name: input.customer.full_name,
      email: input.customer.email,
      phone: input.customer.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (input.saveShippingAddress) {
    await upsertCustomerAddressAction({
      ...input.shipping,
      type: "shipping",
      is_default: true,
    });
  }

  if (!input.billingSameAsShipping && input.billing) {
    await upsertCustomerAddressAction({
      ...input.billing,
      type: "billing",
    });
  }

  const result = await placeStorefrontOrder(customerId, input);
  if (!result.ok) {
    const { captureOperationalFailure } = await import("@/lib/observability/operational-errors");
    const message = result.error || "Checkout order failed";
    captureOperationalFailure("checkout", message, {
      operation: "placeCheckoutOrder",
      extra: { paymentMethod: input.paymentMethod },
    });
    return { ok: false, error: result.error };
  }

  revalidatePath("/account/orders");
  return result;
}

export async function verifyRazorpayCheckoutAction(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<CheckoutActionResult> {
  const { customerId, authenticated } = await requireCustomerId();
  if (!authenticated) return { ok: false, error: "Not signed in." };
  if (!customerId) {
    return {
      ok: false,
      error: "Unable to set up your checkout profile. Please try again or contact support.",
    };
  }

  const result = await completeRazorpayOrder({
    ...input,
    customerId,
  });

  if (!result.ok) {
    const { captureOperationalFailure } = await import("@/lib/observability/operational-errors");
    const message = result.error || "Razorpay checkout failed";
    captureOperationalFailure("razorpay", message, {
      operation: "verifyRazorpayCheckout",
      extra: { orderId: input.orderId },
    });
    return { ok: false, error: result.error };
  }

  revalidatePath("/account/orders");
  return { ok: true, error: null, orderId: input.orderId, awb: result.awb };
}

export async function getOrderSuccessDataAction(orderId: string) {
  const { customerId } = await requireCustomerId();
  if (!customerId) return null;
  return getCheckoutOrderSummary(orderId, customerId);
}

export {
  upsertCustomerAddressAction,
  deleteCustomerAddressAction,
  lookupPincodeAction,
  getCustomerAddressesAction,
};
