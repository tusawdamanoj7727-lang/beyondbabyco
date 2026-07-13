import { z } from "zod";

import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { uuidSchema } from "@/lib/api/schemas";
import { jsonOk, jsonError } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { isUserPanelRole, syncUserAccess } from "@/lib/admin/user-management-server";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  userId: uuidSchema,
  role: z.string().refine(isUserPanelRole, "Invalid role"),
});

/** Update a user's panel role in auth metadata + profiles (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const parsed = await parseJsonBody(request, { schema: updateRoleSchema });
    if (!parsed.ok) {
      return jsonError(parsed.error, parsed.status);
    }

    const { userId, role } = parsed.data;

    const { data: existing, error: fetchError } = await gate.admin.auth.admin.getUserById(userId);
    if (fetchError || !existing.user) {
      return jsonError("User not found", 404);
    }

    const fullName =
      typeof existing.user.user_metadata?.full_name === "string"
        ? existing.user.user_metadata.full_name
        : undefined;

    await syncUserAccess(gate.admin, userId, role, { fullName, isActive: true });

    logApiAction({
      action: "api.admin.users.update_role",
      entity: "profiles",
      entityId: userId,
      metadata: { role },
    });

    return jsonOk({ userId, role });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
