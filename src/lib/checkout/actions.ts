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
  ensureGuestCustomer,
  resolveCheckoutCustomerIdForOrder,
  writeGuestCheckoutSession,
} from "@/lib/checkout/guest-customer";
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
  /** True when the shopper is not signed in — guest checkout mode. */
  isGuest: boolean;
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

async function resolveAuthenticatedCustomerId(): Promise<{
  customerId: string | null;
  authenticated: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) return { customerId: null, authenticated: false };

  let customerId = await getCustomerIdForUser(user.id);
  if (!customerId) {
    customerId = await ensureCustomerRecordsForUser(user);
  }

  return { customerId, authenticated: true };
}

/** Always returns checkout data — guests get an empty form; logged-in users get profile + addresses. */
export async function getCheckoutInitialDataAction(): Promise<CheckoutInitialData> {
  const paymentOptions = await getStorefrontPaymentOptions();
  const user = await getCurrentUser();
  const { customerId, authenticated } = await resolveAuthenticatedCustomerId();

  if (!authenticated || !user || !customerId) {
    return {
      fullName: "",
      email: "",
      phone: "",
      addresses: [],
      razorpayAvailable: paymentOptions.razorpayAvailable,
      razorpayKeyId: paymentOptions.razorpayKeyId,
      isGuest: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: customer }, addresses] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("customers").select("full_name, email, phone").eq("id", customerId).maybeSingle(),
    getCustomerAddressesAction(),
  ]);

  return {
    fullName: customer?.full_name ?? profile?.full_name ?? "",
    email: customer?.email ?? user.email ?? "",
    phone: customer?.phone?.replace(/\D/g, "").slice(-10) ?? "",
    addresses,
    razorpayAvailable: paymentOptions.razorpayAvailable,
    razorpayKeyId: paymentOptions.razorpayKeyId,
    isGuest: false,
  };
}

export async function placeCheckoutOrderAction(input: PlaceOrderInput): Promise<CheckoutActionResult> {
  const { customerId: authCustomerId, authenticated } = await resolveAuthenticatedCustomerId();

  let customerId = authCustomerId;
  let isGuest = false;

  if (!authenticated || !customerId) {
    try {
      customerId = await ensureGuestCustomer({
        email: input.customer.email,
        fullName: input.customer.full_name,
        phone: input.customer.phone,
      });
      isGuest = true;
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not start guest checkout.",
      };
    }
  }

  if (!customerId) {
    return {
      ok: false,
      error: "Unable to set up your checkout profile. Please try again or contact support.",
    };
  }

  const supabase = await createSupabaseServerClient();
  // Guests are updated via service role inside ensureGuestCustomer; auth users via RLS.
  if (!isGuest) {
    await supabase
      .from("customers")
      .update({
        full_name: input.customer.full_name,
        email: input.customer.email,
        phone: input.customer.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId);
  }

  if (!isGuest && input.saveShippingAddress) {
    await upsertCustomerAddressAction({
      ...input.shipping,
      type: "shipping",
      is_default: true,
    });
  }

  if (!isGuest && !input.billingSameAsShipping && input.billing) {
    await upsertCustomerAddressAction({
      ...input.billing,
      type: "billing",
    });
  }

  const result = await placeStorefrontOrder(customerId, input, { isLoggedIn: !isGuest });
  if (!result.ok) return { ok: false, error: result.error };

  if (isGuest && result.orderId) {
    await writeGuestCheckoutSession(customerId, result.orderId);
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
  const { customerId, via } = await resolveCheckoutCustomerIdForOrder(input.orderId);
  if (!customerId) {
    return { ok: false, error: via === null ? "Not signed in." : "Order not found." };
  }

  const result = await completeRazorpayOrder({
    ...input,
    customerId,
  });

  if (!result.ok) return { ok: false, error: result.error };

  if (via === "guest") {
    await writeGuestCheckoutSession(customerId, input.orderId);
  }

  revalidatePath("/account/orders");
  return { ok: true, error: null, orderId: input.orderId, awb: result.awb };
}

export async function getOrderSuccessDataAction(orderId: string) {
  const { customerId, via } = await resolveCheckoutCustomerIdForOrder(orderId);
  if (!customerId) return null;
  const summary = await getCheckoutOrderSummary(orderId, customerId);
  if (!summary) return null;
  return { ...summary, isGuest: via === "guest" };
}

export {
  upsertCustomerAddressAction,
  deleteCustomerAddressAction,
  lookupPincodeAction,
  getCustomerAddressesAction,
};
