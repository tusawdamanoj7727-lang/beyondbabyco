import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const GUEST_COOKIE = "bbc_guest_checkout";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function signingSecret(): string {
  const dedicated = process.env.GUEST_CHECKOUT_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback =
    process.env.CRON_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!fallback) {
    throw new Error("Guest checkout signing secret is not configured.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[guest-customer] Using fallback signing secret — set GUEST_CHECKOUT_SECRET in production.",
    );
  }
  return fallback;
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export interface GuestCheckoutSession {
  customerId: string;
  orderIds: string[];
  exp: number;
}

function encodeSession(session: GuestCheckoutSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(raw: string | undefined): GuestCheckoutSession | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sig, signPayload(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GuestCheckoutSession;
    if (!parsed?.customerId || !Array.isArray(parsed.orderIds) || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Create or reuse an email-only customer (profile_id null) for guest checkout. */
export async function ensureGuestCustomer(input: {
  email: string;
  fullName: string;
  phone: string;
}): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim() || "Guest";
  const phone = input.phone.replace(/\D/g, "").slice(-10);
  if (!email) throw new Error("Email is required for guest checkout.");

  const service = createSupabaseServiceClient();

  // Prefer existing orphan (guest) customer with same email.
  const { data: guests } = await service
    .from("customers")
    .select("id, full_name, phone")
    .is("profile_id", null)
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  const guest = guests?.[0];
  if (guest) {
    await service
      .from("customers")
      .update({
        full_name: fullName || guest.full_name,
        phone: phone || guest.phone,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guest.id);
    return guest.id;
  }

  // Do not hijack a registered customer's row — create a fresh guest row.
  const { data: created, error } = await service
    .from("customers")
    .insert({
      profile_id: null,
      email,
      full_name: fullName,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create guest customer.");
  }
  return created.id;
}

export async function readGuestCheckoutSession(): Promise<GuestCheckoutSession | null> {
  const jar = await cookies();
  return decodeSession(jar.get(GUEST_COOKIE)?.value);
}

export async function writeGuestCheckoutSession(
  customerId: string,
  orderId: string,
): Promise<void> {
  const existing = await readGuestCheckoutSession();
  const orderIds = new Set(existing?.customerId === customerId ? existing.orderIds : []);
  orderIds.add(orderId);
  const session: GuestCheckoutSession = {
    customerId,
    orderIds: [...orderIds].slice(-20),
    exp: Date.now() + COOKIE_MAX_AGE_SEC * 1000,
  };
  const jar = await cookies();
  jar.set(GUEST_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

export async function guestOwnsOrder(orderId: string): Promise<string | null> {
  const session = await readGuestCheckoutSession();
  if (!session) return null;
  if (!session.orderIds.includes(orderId)) return null;

  const service = createSupabaseServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.customer_id || order.customer_id !== session.customerId) return null;
  return session.customerId;
}

export async function resolveCheckoutCustomerIdForOrder(orderId: string): Promise<{
  customerId: string | null;
  via: "auth" | "guest" | null;
}> {
  const { getCurrentUser } = await import("@/lib/auth/session");
  const { getCustomerIdForUser } = await import("@/lib/orders/customer-auth");
  const { ensureCustomerRecordsForUser } = await import("@/lib/auth/customer-bootstrap");

  const user = await getCurrentUser();
  if (user) {
    let customerId = await getCustomerIdForUser(user.id);
    if (!customerId) customerId = await ensureCustomerRecordsForUser(user);
    if (customerId) {
      const service = createSupabaseServiceClient();
      const { data: order } = await service
        .from("orders")
        .select("customer_id")
        .eq("id", orderId)
        .maybeSingle();
      if (order?.customer_id === customerId) {
        return { customerId, via: "auth" };
      }
    }
  }

  const guestCustomerId = await guestOwnsOrder(orderId);
  if (guestCustomerId) return { customerId: guestCustomerId, via: "guest" };
  return { customerId: null, via: null };
}

/**
 * Link orphan guest customer (same email, profile_id null) to this auth user.
 * Reassigns guest orders/addresses onto the profile-linked customer when needed.
 */
export async function claimGuestCustomerForUser(user: User): Promise<string | null> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return null;

  const service = createSupabaseServiceClient();

  const { data: guests } = await service
    .from("customers")
    .select("id")
    .is("profile_id", null)
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!guests?.length) return null;

  const { data: linked } = await service
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const primaryGuestId = guests[0]!.id;

  if (linked) {
    for (const guest of guests) {
      if (guest.id === linked.id) continue;
      await service.from("orders").update({ customer_id: linked.id }).eq("customer_id", guest.id);
      await service
        .from("customer_addresses")
        .update({ customer_id: linked.id })
        .eq("customer_id", guest.id);
      await service.from("payments").update({ customer_id: linked.id }).eq("customer_id", guest.id);
      await service.from("customers").delete().eq("id", guest.id);
    }
    return linked.id;
  }

  await service
    .from("customers")
    .update({
      profile_id: user.id,
      email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", primaryGuestId);

  for (const guest of guests.slice(1)) {
    await service.from("orders").update({ customer_id: primaryGuestId }).eq("customer_id", guest.id);
    await service
      .from("customer_addresses")
      .update({ customer_id: primaryGuestId })
      .eq("customer_id", guest.id);
    await service.from("payments").update({ customer_id: primaryGuestId }).eq("customer_id", guest.id);
    await service.from("customers").delete().eq("id", guest.id);
  }

  return primaryGuestId;
}
