"use server";

import { delhiveryCheckServiceability } from "@/lib/delhivery/service";
import { ESTIMATED_DELIVERY_DAYS } from "@/lib/storefront/shipping";

export interface DeliveryEstimateResult {
  ok: boolean;
  error: string | null;
  pincode?: string;
  serviceable?: boolean;
  cod?: boolean;
  prepaid?: boolean;
  estimatedDelivery?: string;
}

export async function checkDeliveryEstimateAction(pincode: string): Promise<DeliveryEstimateResult> {
  const cleaned = pincode.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length !== 6) {
    return { ok: false, error: "Enter a valid 6-digit PIN code." };
  }

  const result = await delhiveryCheckServiceability(cleaned);
  if (!result.ok || !result.data) {
    return { ok: false, error: result.error ?? "Could not check delivery." };
  }

  const data = result.data as {
    pincode: string;
    serviceable: boolean;
    cod: boolean;
    prepaid: boolean;
  };

  if (!data.serviceable) {
    return {
      ok: true,
      error: null,
      pincode: cleaned,
      serviceable: false,
      cod: false,
      prepaid: false,
      estimatedDelivery: undefined,
    };
  }

  return {
    ok: true,
    error: null,
    pincode: cleaned,
    serviceable: true,
    cod: data.cod,
    prepaid: data.prepaid,
    estimatedDelivery: ESTIMATED_DELIVERY_DAYS,
  };
}
