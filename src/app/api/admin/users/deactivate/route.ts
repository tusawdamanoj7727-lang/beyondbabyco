import { z } from "zod";

import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { uuidSchema } from "@/lib/api/schemas";
import { jsonOk, jsonError } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

const deactivateSchema = z.object({
  userId: uuidSchema,
});

/** Ban a user and mark their profile inactive (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const parsed = await parseJsonBody(request, { schema: deactivateSchema });
    if (!parsed.ok) {
      return jsonError(parsed.error, parsed.status);
    }

    const { userId } = parsed.data;

    const { error: banError } = await gate.admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
    if (banError) {
      logger.error("admin.users.deactivate", { error: banError.message });
      return jsonError("Could not deactivate user", 400);
    }

    const { error: profileError } = await gate.admin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", userId);

    if (profileError) {
      logger.error("admin.users.deactivate.profile", { error: profileError.message });
      return jsonError("Request failed", 500);
    }

    logApiAction({
      action: "api.admin.users.deactivate",
      entity: "profiles",
      entityId: userId,
    });

    return jsonOk({ userId, deactivated: true });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
