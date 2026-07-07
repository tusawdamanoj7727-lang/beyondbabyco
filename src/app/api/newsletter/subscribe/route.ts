import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; name?: string; source?: string };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const source = String(body.source ?? "website");
    const name = body.name?.trim() || null;

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      name,
      source,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
      });
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Welcome to the BeyondBabyCo family!",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
