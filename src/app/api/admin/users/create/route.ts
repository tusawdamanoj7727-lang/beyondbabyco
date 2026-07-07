import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonOk } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { isUserPanelRole, syncUserAccess } from "@/lib/admin/user-management";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().refine(isUserPanelRole, "Invalid role"),
});

/** Create a new auth user and link profile + role (admin only, service role). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    const { data, error } = await gate.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role,
        is_admin: role === "super_admin" || role === "admin",
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    await syncUserAccess(gate.admin, data.user.id, role, { fullName: name, isActive: true });

    return jsonOk({ userId: data.user.id }, 201);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
