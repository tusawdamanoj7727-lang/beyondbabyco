import { jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { delhiveryCheckServiceability } from "@/lib/delhivery/service";
import { serviceabilityQuerySchema } from "@/lib/delhivery/schemas";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SHIPPING_MANAGE);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const parsed = serviceabilityQuerySchema.safeParse({ pincode: searchParams.get("pincode") });
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid pincode", 422);
  }

  const result = await delhiveryCheckServiceability(parsed.data.pincode);
  if (!result.ok) return jsonError(result.error ?? "Serviceability check failed", 502);
  return jsonOk({ data: result.data ?? {} });
}

export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SHIPPING_MANAGE);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = serviceabilityQuerySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid pincode", 422);
  }

  const result = await delhiveryCheckServiceability(parsed.data.pincode);
  if (!result.ok) return jsonError(result.error ?? "Serviceability check failed", 502);
  return jsonOk({ data: result.data ?? {} });
}
