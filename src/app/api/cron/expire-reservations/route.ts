import { expireStaleInventoryReservations } from "@/lib/inventory/order-reservations";
import { requireCronAuth } from "@/lib/security/cron-auth";
import { handleApiError, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  try {
    const expiredOrders = await expireStaleInventoryReservations();
    return jsonOk({
      expiredOrders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "cron.expire-reservations");
  }
}
