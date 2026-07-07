import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonOk } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";

export const dynamic = "force-dynamic";

const deactivateSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
});

/** Ban a user and mark their profile inactive (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = deactivateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { userId } = parsed.data;

    const { error: banError } = await gate.admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
    if (banError) {
      return NextResponse.json({ ok: false, error: banError.message }, { status: 400 });
    }

    const { error: profileError } = await gate.admin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    return jsonOk({ userId, deactivated: true });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
