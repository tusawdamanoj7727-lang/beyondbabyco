import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function handleLogout(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  void supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
