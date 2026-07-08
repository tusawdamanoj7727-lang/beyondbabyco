import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonOk } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { generateTemporaryPassword } from "@/lib/admin/user-management-server";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
});

/** Set a new temporary password for a user (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { userId } = parsed.data;
    const password = generateTemporaryPassword();

    const { error } = await gate.admin.auth.admin.updateUserById(userId, { password });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return jsonOk({ userId, password });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
