import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Destroys the session and redirects to the admin login page.
 * Writes a logout audit entry before clearing cookies.
 */
async function handleLogout(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    void supabase.rpc("log_activity", {
      p_action: "auth.logout",
      p_entity: "session",
    }).then(({ error }) => {
      if (error) console.warn("[auth] log_activity skipped:", error.message);
    });
  }

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
