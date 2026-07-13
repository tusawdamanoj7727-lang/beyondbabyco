import { z } from "zod";

import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { emailSchema, shortString } from "@/lib/api/schemas";
import { jsonOk, jsonError } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { panelRoleToDbRole } from "@/lib/admin/user-management";
import { isUserPanelRole, syncUserAccess } from "@/lib/admin/user-management-server";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: shortString(120).min(1, "Name is required"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.string().refine(isUserPanelRole, "Invalid role"),
});

/** Create a new auth user and link profile + role (admin only, service role). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const parsed = await parseJsonBody(request, { schema: createSchema });
    if (!parsed.ok) {
      return jsonError(parsed.error, parsed.status);
    }

    const { name, email, password, role } = parsed.data;

    const { data, error } = await gate.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        role: panelRoleToDbRole(role),
        is_admin: role === "super_admin" || role === "admin",
      },
    });

    if (error) {
      logger.error("admin.users.create", { error: error.message });
      return jsonError("Could not create user", 400);
    }

    await syncUserAccess(gate.admin, data.user.id, role, { fullName: name, isActive: true });

    logApiAction({
      action: "api.admin.users.create",
      entity: "profiles",
      entityId: data.user.id,
      metadata: { email, role },
    });

    return jsonOk({ userId: data.user.id }, 201);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
