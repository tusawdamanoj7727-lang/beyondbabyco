import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonOk } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { isUserPanelRole, syncUserAccess } from "@/lib/admin/user-management";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  role: z.string().refine(isUserPanelRole, "Invalid role"),
});

/** Update a user's panel role in auth metadata + profiles (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { userId, role } = parsed.data;

    const { data: existing, error: fetchError } = await gate.admin.auth.admin.getUserById(userId);
    if (fetchError || !existing.user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const fullName =
      typeof existing.user.user_metadata?.full_name === "string"
        ? existing.user.user_metadata.full_name
        : undefined;

    await syncUserAccess(gate.admin, userId, role, { fullName, isActive: true });

    return jsonOk({ userId, role });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
