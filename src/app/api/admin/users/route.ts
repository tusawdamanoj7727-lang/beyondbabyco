import { NextResponse } from "next/server";

import { jsonOk } from "@/lib/api/route-helpers";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { buildAdminUserRow } from "@/lib/admin/user-management-server";

export const dynamic = "force-dynamic";

/** List auth users with profile + role data (admin only, service role). */
export async function GET(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("perPage")) || 50));

    const { data, error } = await gate.admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const users = data.users ?? [];
    const ids = users.map((u) => u.id);

    const profilesById = new Map<
      string,
      {
        full_name: string | null;
        is_active: boolean;
        roles: { name: string } | null;
      }
    >();

    if (ids.length > 0) {
      const { data: profiles, error: profileError } = await gate.admin
        .from("profiles")
        .select("id, full_name, is_active, roles(name)")
        .in("id", ids);

      if (profileError) {
        return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
      }

      for (const row of profiles ?? []) {
        const roleData = row.roles as { name: string } | { name: string }[] | null;
        const roles = Array.isArray(roleData) ? roleData[0] ?? null : roleData;
        profilesById.set(row.id, {
          full_name: row.full_name,
          is_active: row.is_active,
          roles,
        });
      }
    }

    const rows = users.map((user) =>
      buildAdminUserRow(user, profilesById.get(user.id)),
    );

    return jsonOk({
      users: rows,
      page,
      perPage,
      total: data.total ?? rows.length,
    });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
